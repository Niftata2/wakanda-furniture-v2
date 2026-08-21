import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ProductService } from '@/services/product.service';
import { LeadService } from '@/services/lead.service';
import { RateLimitService } from '@/services/rate-limit.service';
import { IntentService, Intent } from '@/services/intent.service';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const OWNER_ID = process.env.OWNER_TELEGRAM_ID!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try { return await fn(); }
  catch (err) {
    if (retries === 0) throw err;
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

async function sendMessage(chatId: number, text: string, options: any = {}) {
  await withRetry(() => fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options }),
  }));
}

async function sendPhoto(chatId: number, photoUrl: string, caption: string, options: any = {}) {
  await withRetry(() => fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML', ...options }),
  }));
}

async function sendTyping(chatId: number) {
  try {
    await fetch(`${TELEGRAM_API}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
    });
  } catch { /* ignore */ }
}

async function answerCallback(id: string, text = '') {
  try {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: id, text }),
    });
  } catch { /* ignore */ }
}

async function getOrCreateUser(telegramId: number, first: string, last?: string, username?: string) {
  const { data: existing } = await supabase.from('telegram_users').select('*').eq('telegram_id', telegramId).single();
  if (existing) return existing;
  const { data } = await supabase.from('telegram_users')
    .insert({ telegram_id: telegramId, first_name: first, last_name: last, username })
    .select().single();
  return data;
}

async function getOrCreateConversation(telegramId: number, userId: string) {
  const { data: active } = await supabase.from('conversations')
    .select('*').eq('telegram_id', telegramId).eq('status', 'active')
    .order('created_at', { ascending: false }).limit(1).single();
  if (active) return active;
  const { data } = await supabase.from('conversations')
    .insert({ telegram_user_id: userId, telegram_id: telegramId, status: 'active' })
    .select().single();
  return data;
}

function detectLanguage(text: string): 'en' | 'am' {
  return /[ሀ-]/.test(text) ? 'am' : 'en';
}

function mainMenuKeyboard(lang: 'en' | 'am') {
  const items = lang === 'am'
    ? [['🛋️ የቤት ዕቃዎች', 'browse'], ['✨ ምክር', 'reco'], ['🛒 ትዕዛዝ', 'order'],
       ['🎨 ዩ ትዕዛዝ', 'custom'], ['💬 ጥያቄ', 'ask'], ['👨‍💼 ው', 'human'], ['🌐 ንቋ', 'lang']]
    : [['🛋️ Browse Furniture', 'browse'], ['✨ Recommendations', 'reco'], ['🛒 Place Order', 'order'],
       ['🎨 Custom Furniture', 'custom'], ['💬 Ask Question', 'ask'], ['👨‍💼 Talk to Human', 'human'], ['🌐 Language', 'lang']];
  return { inline_keyboard: items.map(([t, d]) => [{ text: t, callback_data: d }]) };
}

async function notifyOwner(lead: any, user: any, type: string) {
  const icons: any = { new_lead: '🔔', order_request: '🛒', custom_request: '🎨', human_request: '👨‍💼', complaint: '⚠️', high_intent: '⚡', product_interest: '🛋️' };
  const message = `
━━━━━━━━━━━━━━━━━━
${icons[type] || '🔔'} <b>${type.toUpperCase().replace('_', ' ')}</b>
━━━━━━━━━━━━━━━━━━

👤 ${user.first_name} ${user.last_name || ''}
📱 ${lead.phone || 'Not shared'}
🆔 <code>${user.telegram_id}</code>
🛋️ ${lead.product_name || '—'}
💰 ${lead.budget_range || '—'}
📍 ${lead.delivery_location || '—'}

💬 ${lead.message || '—'}

📅 ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━`.trim();

  await sendMessage(Number(OWNER_ID), message, {
    reply_markup: {
      inline_keyboard: [
        [
          user.username ? { text: '💬 Message', url: `https://t.me/${user.username}` } : { text: '💬 Message', url: `tg://user?id=${user.telegram_id}` },
          { text: '✅ Contacted', callback_data: `mc_${lead.id || 'x'}` },
        ],
        [{ text: '⭐ Qualified', callback_data: `mq_${lead.id || 'x'}` }, { text: '❌ Close', callback_data: `ml_${lead.id || 'x'}` }],
      ],
    },
  });
}

async function showProductCard(chatId: number, p: any, lang: 'en' | 'am') {
  const price = p.price?.toLocaleString() || 'Contact';
  const caption = `🛋️ <b>${p.name}</b>\n📂 ${p.category}\n💰 <b>${price} ETB</b>${p.short_description ? `\n\n${p.short_description}` : ''}`;
  await sendPhoto(chatId, p.image_url, caption, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛒 Order', callback_data: `o_${p.id}` }, { text: '💬 Ask', callback_data: `a_${p.id}` }],
        [{ text: '◀️ Back', callback_data: 'browse' }],
      ],
    },
  });
}

async function generateAIResponse(userMessage: string, lang: 'en' | 'am'): Promise<string> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return lang === 'am' ? 'ሰላም!' : 'Hello! How can I help you today?';

  let prodList = '';
  try {
    const products = await ProductService.getFeaturedProducts(8);
    prodList = products.map(p => `- ${p.name} (${p.category}): ${p.price?.toLocaleString()} ETB`).join('\n');
  } catch { /* db down, continue without products */ }

  const systemPrompt = lang === 'am'
    ? `You are a friendly sales assistant for Wakanda Furniture. Reply in Amharic. Under 3 sentences. 1-2 emojis. Products:\n${prodList}\n\nCustomer: ${userMessage}\nResponse:`
    : `You are a friendly sales assistant for Wakanda Furniture. Reply in English. Under 3 sentences. 1-2 emojis. Products:\n${prodList}\n\nCustomer: ${userMessage}\nResponse:`;

  try {
    const res = await withRetry(() => fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }) }
    ));
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || (lang === 'am' ? 'ሰላም!' : 'Hello!');
  } catch {
    return lang === 'am' ? 'ይቅርታ፣ እባክ እንደና ይክሩ' : 'Sorry, please try again.';
  }
}

// ───── MAIN WEBHOOK ─────
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // ── Callback queries (button clicks) ──
    if (update.callback_query) {
      const { data, id: cbId } = update.callback_query;
      const from = update.callback_query.from;
      await answerCallback(cbId);

      let lang: 'en' | 'am' = 'en';
      let user: any = null;
      let convo: any = null;
      try {
        user = await getOrCreateUser(from.id, from.first_name, from.last_name, from.username);
        if (user) convo = await getOrCreateConversation(from.id, user.id);
        if (convo?.language) lang = convo.language;
      } catch { /* db down - continue anyway */ }

      const userInfo = user || { first_name: from.first_name, last_name: from.last_name || '', telegram_id: from.id, username: from.username };

      try {
        if (data === 'browse' || data === 'order') {
          const cats = await ProductService.getCategories();
          if (!cats || cats.length === 0) {
            await sendMessage(from.id, lang === 'am' ? '😔 አሁን ምንም እቃ የለም። በቅርቡ ይመለሱ!' : '😔 No products available right now. Please check back soon!');
          } else {
            await sendMessage(from.id, lang === 'am' ? '📂 ድብ ይምረጡ:' : '📂 Choose a category:', {
              reply_markup: { inline_keyboard: cats.map((c: any) => [{ text: `${c.emoji || '🛋️'} ${c.name}`, callback_data: `cat_${c.name}` }]) },
            });
          }
        }
        else if (data === 'reco') {
          const prods = await ProductService.getFeaturedProducts(5);
          if (!prods || prods.length === 0) {
            await sendMessage(from.id, lang === 'am' ? '😔 ምክር በቅርቡ!' : '😔 Recommendations coming soon! Tap 🛋️ Browse Furniture meanwhile.');
          } else {
            await sendMessage(from.id, lang === 'am' ? '✨ ለእርስዎ የተመረጡ:' : '✨ Hand-picked for you:');
            for (const p of prods) await showProductCard(from.id, p, lang);
          }
        }
        else if (data === 'custom') {
          await sendMessage(from.id, lang === 'am'
            ? '🎨 ልዩ እቃዎን ይግለጹ: አይነት፣ መጠን፣ ቁቁስ እና ዘይቤ። እኛ እናዘጋጃለን!'
            : '🎨 Describe your custom furniture: type, dimensions, material & style. Our craftsmen will bring it to life!');
        }
        else if (data === 'ask') {
          await sendMessage(from.id, lang === 'am' ? '💬 ጥያቄዎን ይጻ — AI ይመልሳል!' : '💬 Type your question and our AI assistant will answer instantly!');
        }
        else if (data === 'human') {
          try {
            const lead = await LeadService.createLead({
              telegram_user_id: user?.id || null, conversation_id: convo?.id || null,
              telegram_id: from.id, customer_name: `${from.first_name} ${from.last_name || ''}`,
              message: 'Requested to talk to a human', language: lang, priority: 'high', source: 'telegram',
            });
            if (lead) await notifyOwner(lead, userInfo, 'human_request');
          } catch {
            await notifyOwner({ product_name: null, message: 'Requested to talk to a human' }, userInfo, 'human_request');
          }
          await sendMessage(from.id, lang === 'am' ? '👨💼 ጥያቄዎ ተልኳል! ቡዙኙ በቅርቡ ያኝዎታል።' : '👨‍💼 Request sent! Our team will contact you shortly.');
        }
        else if (data.startsWith('cat_')) {
          const prods = await ProductService.getProductsByCategory(data.replace('cat_', ''), 5);
          if (!prods || prods.length === 0) {
            await sendMessage(from.id, lang === 'am' ? '😔 በህ ድብ ንም የለም።' : '😔 No products in this category yet.');
          } else {
            for (const p of prods) await showProductCard(from.id, p, lang);
          }
        }
        else if (data.startsWith('o_')) {
          const p = await ProductService.getProductById(data.replace('o_', ''));
          const name = p?.name || 'Item';
          try {
            const lead = await LeadService.createLead({
              telegram_user_id: user?.id || null, conversation_id: convo?.id || null,
              telegram_id: from.id, customer_name: `${from.first_name} ${from.last_name || ''}`,
              product_name: name, message: `Order request for ${name}`, language: lang, priority: 'urgent', source: 'telegram',
            });
            if (lead) await notifyOwner(lead, userInfo, 'order_request');
          } catch {
            await notifyOwner({ product_name: name, message: `Order request for ${name}` }, userInfo, 'order_request');
          }
          await sendMessage(from.id, lang === 'am'
            ? `✅ የ ${name} ትዛዝ ተቀብለናል! በቅርቡ እናገኝዎታል። 🙏`
            : `✅ Order request for <b>${name}</b> received! Our team will contact you shortly. 🙏`);
        }
        else if (data.startsWith('a_')) {
          const p = await ProductService.getProductById(data.replace('a_', ''));
          await sendMessage(from.id, p
            ? `💬 Ask anything about <b>${p.name}</b> — just type your question!`
            : '💬 Type your question!');
        }
        else if (data.startsWith('mc_')) { try { await LeadService.updateLead(data.replace('mc_', ''), { status: 'contacted' }); } catch {} await sendMessage(from.id, '✅ Marked contacted'); }
        else if (data.startsWith('mq_')) { try { await LeadService.updateLead(data.replace('mq_', ''), { status: 'qualified', priority: 'urgent' }); } catch {} await sendMessage(from.id, '⭐ Marked qualified'); }
        else if (data.startsWith('ml_')) { try { await LeadService.updateLead(data.replace('ml_', ''), { status: 'lost' }); } catch {} await sendMessage(from.id, '❌ Closed'); }
        else if (data === 'lang') {
          const newLang = lang === 'en' ? 'am' : 'en';
          try { if (convo) await supabase.from('conversations').update({ language: newLang }).eq('id', convo.id); } catch {}
          await sendMessage(from.id, newLang === 'am' ? '🌐 ቋንቋ ወ አማርኛ ተቀይሯል!' : '🌐 Language changed to English!', { reply_markup: mainMenuKeyboard(newLang) });
        }
      } catch (e) {
        await sendMessage(from.id, '⚠️ Something went wrong. Please try again in a moment.');
      }

      return NextResponse.json({ ok: true });
    }

    // ── Regular messages ──
    const message = update.message;
    if (!message) return NextResponse.json({ ok: true });

    const telegramId = message.chat.id;
    const from = message.from;
    if (!from || from.is_bot) return NextResponse.json({ ok: true });

    if (RateLimitService.isDuplicate(message.message_id)) return NextResponse.json({ ok: true });
    const rateCheck = RateLimitService.isRateLimited(telegramId);
    if (rateCheck.limited) {
      await sendMessage(telegramId, `⏱️ Too many messages. Try again in ${rateCheck.retryAfter}s.`);
      return NextResponse.json({ ok: true });
    }
    if (RateLimitService.hasCooldown(telegramId)) return NextResponse.json({ ok: true });

    await sendTyping(telegramId);

    const text = message.text || '';
    const lang = detectLanguage(text);

    // ── /start ── ALWAYS respond first
    if (text.startsWith('/start')) {
      await sendMessage(telegramId, lang === 'am' ? '👋 እንን ደህና መጡ!' : '👋 Welcome to Wakanda Furniture!');
      await sendMessage(telegramId, lang === 'am' ? 'ምን ልርዳዎት?' : 'How can I help?', { reply_markup: mainMenuKeyboard(lang) });
      try { await getOrCreateUser(telegramId, from.first_name, from.last_name, from.username); } catch {}
      return NextResponse.json({ ok: true });
    }

    if (!text) return NextResponse.json({ ok: true });

    let user: any = null;
    let convo: any = null;
    try {
      user = await getOrCreateUser(telegramId, from.first_name, from.last_name, from.username);
      if (user) convo = await getOrCreateConversation(telegramId, user.id);
    } catch { /* db down */ }

    // ── Intent + lead creation (safe) ──
    try {
      const intent = IntentService.classify(text, lang);
      if (convo) await IntentService.updateIntent(convo.id, telegramId, intent);
      if (IntentService.isHighPriority(intent)) {
        const userInfo = user || { first_name: from.first_name, last_name: from.last_name || '', telegram_id: telegramId, username: from.username };
        const lead = await LeadService.createLead({
          telegram_user_id: user?.id || null, conversation_id: convo?.id || null,
          telegram_id: telegramId, customer_name: `${from.first_name} ${from.last_name || ''}`,
          message: text, language: lang, priority: 'high', source: 'telegram',
        });
        if (lead) await notifyOwner(lead, userInfo, IntentService.getNotificationType(intent));
      }
    } catch { /* db down */ }

    // ── AI response (works even without DB) ──
    const reply = await generateAIResponse(text, lang);
    await sendMessage(telegramId, reply);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export const runtime = 'nodejs';