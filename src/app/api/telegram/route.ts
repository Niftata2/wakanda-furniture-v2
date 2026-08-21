import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ProductService } from '@/services/product.service';
import { LeadService } from '@/services/lead.service';
import { RateLimitService } from '@/services/rate-limit.service';
import { LeadScoreService } from '@/services/lead-score.service';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const OWNER_ID = process.env.OWNER_TELEGRAM_ID!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try { return await fn(); } catch (err) { if (retries === 0) throw err; await new Promise(r => setTimeout(r, delay)); return withRetry(fn, retries - 1, delay * 2); }
}

async function sendMessage(chatId: number, text: string, options: any = {}) {
  await withRetry(() => fetch(`${TELEGRAM_API}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options }) }));
}

async function sendPhoto(chatId: number, photoUrl: string, caption: string, options: any = {}) {
  await withRetry(() => fetch(`${TELEGRAM_API}/sendPhoto`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML', ...options }) }));
}

async function sendTyping(chatId: number) {
  try { await fetch(`${TELEGRAM_API}/sendChatAction`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, action: 'typing' }) }); } catch {}
}

async function answerCallback(id: string) {
  try { await fetch(`${TELEGRAM_API}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: id }) }); } catch {}
}

async function getOrCreateUser(telegramId: number, first: string, last?: string, username?: string) {
  const { data: existing } = await supabase.from('telegram_users').select('*').eq('telegram_id', telegramId).single();
  if (existing) return existing;
  const { data } = await supabase.from('telegram_users').insert({ telegram_id: telegramId, first_name: first, last_name: last, username }).select().single();
  return data;
}

async function getOrCreateConversation(telegramId: number, userId: string) {
  const { data: active } = await supabase.from('conversations').select('*').eq('telegram_id', telegramId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single();
  if (active) return active;
  const { data } = await supabase.from('conversations').insert({ telegram_user_id: userId, telegram_id: telegramId, status: 'active' }).select().single();
  return data;
}

function detectLanguage(text: string): 'en' | 'am' { return /[\u1200-\u137F]/.test(text) ? 'am' : 'en'; }

function mainMenuKeyboard(lang: 'en' | 'am') {
  const items = lang === 'am'
    ? [['🛋️ የቤት ዕቃች', 'browse'], ['✨ ምክር', 'reco'], ['🎨 ዩ ዕዛ', 'custom'], ['💬 ጥያቄ', 'ask'], ['👨‍💼 ሰው', 'human'], ['🌐 ቋንቋ', 'lang']]
    : [['🛋️ Browse Furniture', 'browse'], ['✨ Recommendations', 'reco'], ['🎨 Custom Furniture', 'custom'], ['💬 Ask Question', 'ask'], ['👨‍💼 Talk to Human', 'human'], ['🌐 Language', 'lang']];
  return { inline_keyboard: items.map(([t, d]) => [{ text: t, callback_data: d }]) };
}

function orderPanel(orderId: string, status: string) {
  const rows: any[] = [];
  if (status === 'NEW') rows.push([{ text: '✅ Accept', callback_data: `acc_${orderId}` }, { text: '❌ Reject', callback_data: `rej_${orderId}` }]);
  if (status === 'CONFIRMED') rows.push([{ text: '🔨 Start Production', callback_data: `proc_${orderId}` }, { text: '❌ Cancel', callback_data: `rej_${orderId}` }]);
  if (status === 'IN_PRODUCTION') rows.push([{ text: '🚚 Out for Delivery', callback_data: `od_${orderId}` }]);
  if (status === 'OUT_FOR_DELIVERY') rows.push([{ text: '✅ Mark Delivered', callback_data: `done_${orderId}` }]);
  return { inline_keyboard: rows };
}

async function showProductCard(chatId: number, p: any, lang: 'en' | 'am') {
  const price = p.price?.toLocaleString() || 'Contact';
  const caption = `🛋️ <b>${p.name}</b>\n📂 ${p.category}\n💰 <b>${price} ETB</b>${p.short_description ? `\n\n${p.short_description}` : ''}`;
  await sendPhoto(chatId, p.image_url, caption, {
    reply_markup: { inline_keyboard: [[{ text: '🛒 Order This', callback_data: `buy_${p.id}` }, { text: '💬 Ask', callback_data: `a_${p.id}` }], [{ text: '◀️ Back', callback_data: 'browse' }]] }
  });
}

async function getPhotoUrl(photo: any[]) {
  const file_id = photo[photo.length - 1].file_id;
  const res = await fetch(`${TELEGRAM_API}/getFile?file_id=${file_id}`);
  const j = await res.json();
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${j.result.file_path}`;
}

// 🧠 CLEAN AI BRAIN FUNCTION
async function generateAIResponse(userMessage: string, lang: 'en' | 'am'): Promise<string> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return `⚠️ [DEBUG] GEMINI_API_KEY is missing in Vercel!`;

  let prodList = '';
  try { 
    const products = await ProductService.getFeaturedProducts(8); 
    prodList = products.map(p => `- ${p.name} (${p.category}): ${p.price?.toLocaleString()} ETB`).join('\n'); 
  } catch {}

  const prompt = lang === 'am'
    ? `You are a premium, friendly furniture consultant for Wakanda Furniture in Ethiopia. Speak natural Amharic. Be conversational and smooth. Never just say "Hello" if they already said hello. Answer their specific question directly. Keep it under 4 sentences. Use 1-2 emojis. Never say "As an AI". Available Products:\n${prodList}\n\nCustomer: ${userMessage}\nResponse:`
    : `You are a premium, friendly furniture consultant for Wakanda Furniture in Ethiopia. Speak natural English. Be conversational and smooth. Never just say "Hello" if they already said hello. Answer their specific question directly. Keep it under 4 sentences. Use 1-2 emojis. Never say "As an AI". Available Products:\n${prodList}\n\nCustomer: ${userMessage}\nResponse:`;

  try {
    const MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    for (const model of MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) return aiText;
      } catch { continue; }
    }
    return '⚠️ [DEBUG] All AI models failed. Check API key.';
  } catch (e: any) {
    return `⚠️ [DEBUG] AI Brain Error: ${e.message}`;
  }
}

// ══════════ MAIN WEBHOOK ══════════
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    if (update.callback_query) {
      const { data, id: cbId } = update.callback_query;
      const from = update.callback_query.from;
      await answerCallback(cbId);

      let user: any = null; let convo: any = null;
      try {
        user = await getOrCreateUser(from.id, from.first_name, from.last_name, from.username);
        if (user) convo = await getOrCreateConversation(from.id, user.id);
      } catch {}
      const lang: 'en' | 'am' = convo?.language || 'en';
      const userInfo = user || { first_name: from.first_name, last_name: from.last_name || '', telegram_id: from.id, username: from.username };

      let orderId = ''; let newStatus = ''; let customerMsg = '';
      if (data.startsWith('acc_')) { orderId = data.slice(4); newStatus = 'CONFIRMED'; customerMsg = '✅ Great news! Your order has been <b>confirmed</b> by our team. We will contact you shortly! 🙏'; }
      else if (data.startsWith('rej_')) { orderId = data.slice(4); newStatus = 'CANCELLED'; customerMsg = '😔 Unfortunately your order was cancelled. If you have questions, tap Talk to Human — we are here to help.'; }
      else if (data.startsWith('proc_')) { orderId = data.slice(5); newStatus = 'IN_PRODUCTION'; customerMsg = '🔨 Exciting! Your furniture is now <b>in production</b>. Our craftsmen are working on it.'; }
      else if (data.startsWith('od_')) { orderId = data.slice(3); newStatus = 'OUT_FOR_DELIVERY'; customerMsg = '🚚 Your order is <b>out for delivery</b>! Please keep your phone nearby.'; }
      else if (data.startsWith('done_')) { orderId = data.slice(5); newStatus = 'DELIVERED'; customerMsg = '🎉 Your order has been <b>delivered</b>! Thank you for choosing Wakanda Furniture. Enjoy!'; }

      if (orderId) {
        const { data: order } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId).select().single();
        if (order?.customer_telegram_id) await sendMessage(order.customer_telegram_id, customerMsg);
        await sendMessage(from.id, `📦 Order status: <b>${newStatus}</b>`);
        if (newStatus !== 'CANCELLED' && newStatus !== 'DELIVERED') {
          await sendMessage(from.id, lang === 'am' ? 'ቀይ እርምጃ:' : 'Next step:', { reply_markup: orderPanel(orderId, newStatus) });
        }
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('buy_')) {
        try {
          await supabase.from('conversations').update({ checkout_step: 'awaiting_name', cart_product_id: data.replace('buy_', '') }).eq('id', convo.id);
          await sendMessage(from.id, lang === 'am' ? 'ጥሩ ምርጫ! \n\nበትዕዛዙ ላይ ማን ስም ላስቀምጥ?' : "Great choice! 👍\n\nWhat name should I put on the order?");
        } catch {}
        return NextResponse.json({ ok: true });
      }

      if (data === 'confirm_order') {
        try {
          const { data: orderData } = await supabase.from('orders').insert({
            telegram_user_id: user.id, conversation_id: convo.id, product_id: convo.cart_product_id,
            product_name: convo.order_product_name, customer_name: convo.order_name, customer_phone: convo.order_phone,
            delivery_location: convo.order_location, customer_telegram_id: from.id
          }).select().single();
          await supabase.from('conversations').update({ checkout_step: null, cart_product_id: null, order_name: null, order_phone: null, order_location: null, order_product_name: null }).eq('id', convo.id);
          await sendMessage(from.id, lang === 'am' ? '✅ <b>ትዕዛዝዎ ረጋግጧል!</b>\n\nቡዙው በቅርቡ ያገኝታል። 🙏' : '✅ <b>Order Confirmed!</b>\n\nThe Wakanda Furniture team has received your order and will contact you shortly. 🙏');
          const ownerMsg = `🚨 <b>NEW ORDER RECEIVED!</b>\n━━━━━━━━━━━━━━━━━━\n🛋️ <b>${orderData.product_name}</b>\n\n👤 Customer: ${orderData.customer_name}\n📱 Phone: ${orderData.customer_phone}\n📍 Delivery: ${orderData.delivery_location}\n━━━━━━━━━━━━━━━━━━\n🆔 User: <code>${from.id}</code>${from.username ? `\n👤 @${from.username}` : ''}`;
          await sendMessage(Number(OWNER_ID), ownerMsg, { reply_markup: orderPanel(orderData.id, 'NEW') });
        } catch { await sendMessage(from.id, '⚠️ Error saving order. Please try again or talk to our team.'); }
        return NextResponse.json({ ok: true });
      }

      try {
        if (data === 'browse' || data === 'order') {
          const cats = await ProductService.getCategories();
          if (!cats || cats.length === 0) await sendMessage(from.id, '😔 No products right now. Please check back soon!');
          else await sendMessage(from.id, lang === 'am' ? '📂 ድብ ምረ:' : '📂 Choose a category:', { reply_markup: { inline_keyboard: cats.map((c: any) => [{ text: `${c.emoji || '🛋️'} ${c.name}`, callback_data: `cat_${c.name}` }]) } });
        }
        else if (data.startsWith('cat_')) {
          const prods = await ProductService.getProductsByCategory(data.replace('cat_', ''), 5);
          if (!prods || prods.length === 0) await sendMessage(from.id, '😔 No products in this category yet.');
          for (const p of prods) await showProductCard(from.id, p, lang);
        }
        else if (data === 'reco') {
          const prods = await ProductService.getFeaturedProducts(5);
          if (!prods || prods.length === 0) await sendMessage(from.id, '😔 Recommendations coming soon!');
          else { await sendMessage(from.id, lang === 'am' ? '✨ ለእርስዎ የተመረጡ:' : '✨ Hand-picked for you:'); for (const p of prods) await showProductCard(from.id, p, lang); }
        }
        else if (data === 'custom') {
          await supabase.from('conversations').update({ checkout_step: 'custom_desc' }).eq('id', convo.id);
          await sendMessage(from.id, lang === 'am'
            ? '🎨 ዩ እ እናዘጃለን!\n\nምን እንደሚፈልጉ ይለ ወይም ፎቶ ይላኩ።'
            : "🎨 We craft custom furniture!\n\nDescribe what you want (type, size, material, color) — or send me a photo of the design you love.");
        }
        else if (data === 'ask') {
          await sendMessage(from.id, lang === 'am' ? '💬 ጥያቄዎን ይጻ — AI ይመልሳል!' : '💬 Type your question and our AI consultant will answer instantly!');
        }
        else if (data === 'human') {
          try { await LeadService.createLead({ telegram_user_id: user?.id || null, conversation_id: convo?.id || null, telegram_id: from.id, customer_name: `${from.first_name} ${from.last_name || ''}`, message: 'Requested to talk to a human', language: lang, priority: 'high', source: 'telegram' }); } catch {}
          try { await sendMessage(Number(OWNER_ID), `👨‍💼 <b>HUMAN SUPPORT REQUESTED</b>\n\n👤 ${from.first_name} ${from.last_name || ''}\n🆔 <code>${from.id}</code>${from.username ? `\n👤 @${from.username}` : ''}\n\n[💬 Open Chat](tg://user?id=${from.id})`); } catch {}
          await sendMessage(from.id, lang === 'am' ? '👨‍💼 ጥያቄዎ ልኳል! ዙኙ በቅርቡ ያገኝዎታል።' : '👨‍💼 Of course! I have notified our team — they will contact you shortly. 👌');
        }
        else if (data === 'lang') {
          const newLang = lang === 'en' ? 'am' : 'en';
          try { await supabase.from('conversations').update({ language: newLang }).eq('id', convo.id); } catch {}
          await sendMessage(from.id, newLang === 'am' ? '🌐 ቋንቋ ወ አማርኛ ተቀይሯል!' : '🌐 Language switched to English!', { reply_markup: mainMenuKeyboard(newLang) });
        }
        else if (data.startsWith('a_')) {
          await sendMessage(from.id, lang === 'am' ? '💬 ስለዚህ እቃ ጥያቄዎን ይጻፉ!' : '💬 Type your question about this item — our AI consultant will answer!');
        }
      } catch { await sendMessage(from.id, '⚠️ Something went wrong. Please try again.'); }

      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    if (!message || !message.from || message.from.is_bot) return NextResponse.json({ ok: true });

    const telegramId = message.chat.id;
    const from = message.from;
    const text = message.text || '';

    if (RateLimitService.isDuplicate(message.message_id)) return NextResponse.json({ ok: true });
    const rateCheck = RateLimitService.isRateLimited(telegramId);
    if (rateCheck.limited) { await sendMessage(telegramId, `⏱️ Too many messages. Try again in ${rateCheck.retryAfter}s.`); return NextResponse.json({ ok: true }); }
    if (RateLimitService.hasCooldown(telegramId)) return NextResponse.json({ ok: true });

    await sendTyping(telegramId);

    let user: any = null; let convo: any = null;
    try {
      user = await getOrCreateUser(telegramId, from.first_name, from.last_name, from.username);
      if (user) convo = await getOrCreateConversation(telegramId, user.id);
    } catch {}
    const lang: 'en' | 'am' = detectLanguage(text) || convo?.language || 'en';

    if (text.startsWith('/start')) {
      try { await supabase.from('conversations').update({ checkout_step: null }).eq('id', convo.id); } catch {}
      await sendMessage(telegramId, lang === 'am' ? '👋 እንኳን ደህና መጡ!\n\nእኔ የ Wakanda Furniture ግላዊ AI አማካሪ ነኝ' : ' Welcome to Wakanda Furniture!\n\nI am your personal AI furniture consultant. How can I help you today?', { reply_markup: mainMenuKeyboard(lang) });
      return NextResponse.json({ ok: true });
    }

    if (convo?.checkout_step && convo.checkout_step !== 'custom_desc') {
      if (convo.checkout_step === 'awaiting_name') {
        await supabase.from('conversations').update({ checkout_step: 'awaiting_phone', order_name: text }).eq('id', convo.id);
        await sendMessage(telegramId, `Perfect, <b>${text}</b>. 📝\n\nAnd what phone number should our team use to contact you?`);
        return NextResponse.json({ ok: true });
      }
      if (convo.checkout_step === 'awaiting_phone') {
        await supabase.from('conversations').update({ checkout_step: 'awaiting_location', order_phone: text }).eq('id', convo.id);
        await sendMessage(telegramId, 'Got it. 📱\n\nWhere should we deliver it? (e.g., Bole, Hawassa, or your specific area)');
        return NextResponse.json({ ok: true });
      }
      if (convo.checkout_step === 'awaiting_location') {
        const product = await ProductService.getProductById(convo.cart_product_id);
        await supabase.from('conversations').update({ checkout_step: 'awaiting_confirm', order_location: text, order_product_name: product?.name || 'Custom Item' }).eq('id', convo.id);
        const summary = `━━━━━━━━━━━━━━━━━━\n🛋️ <b>WAKANDA FURNITURE</b>\n<b>Order Summary</b>\n\nProduct:\n${product?.name || 'Item'}\n\nPrice:\n${product?.price?.toLocaleString() || '—'} ETB\n\nCustomer:\n${convo.order_name}\n\nPhone:\n${convo.order_phone}\n\nDelivery:\n${text}\n━━━━━━━━━━━━━━━━━━`;
        await sendMessage(telegramId, summary, { reply_markup: { inline_keyboard: [[{ text: '✅ Confirm Order', callback_data: 'confirm_order' }, { text: '❌ Cancel', callback_data: 'browse' }]] } });
        return NextResponse.json({ ok: true });
      }
    }

    if (convo?.checkout_step === 'custom_desc' && (text || message.photo)) {
      let photoUrl = '';
      if (message.photo) { try { photoUrl = await getPhotoUrl(message.photo); } catch {} }
      try { await LeadService.createLead({ telegram_user_id: user?.id || null, conversation_id: convo?.id || null, telegram_id: telegramId, customer_name: `${from.first_name} ${from.last_name || ''}`, message: text || 'Sent a custom furniture photo', language: lang, priority: 'high', source: 'telegram' }); } catch {}
      const ownerCaption = `🎨 <b>CUSTOM FURNITURE REQUEST</b>\n\n👤 ${from.first_name} ${from.last_name || ''}\n🆔 <code>${telegramId}</code>${from.username ? `\n👤 @${from.username}` : ''}\n\n💬 ${text || '(photo only)'}`;
      try {
        if (photoUrl) await sendPhoto(Number(OWNER_ID), photoUrl, ownerCaption);
        else await sendMessage(Number(OWNER_ID), ownerCaption);
      } catch {}
      await supabase.from('conversations').update({ checkout_step: null }).eq('id', convo.id);
      await sendMessage(telegramId, lang === 'am'
        ? '🎨 ተቀብለናል! ቡኙ ዋ እና ምት አዘጋጅቶ በቅርቡ ያኝዎታል። '
        : "🎨 Received! Our craftsmen will review it and our team will get back to you with a quotation shortly. 🙏");
      return NextResponse.json({ ok: true });
    }

    if (message.photo) {
      try {
        const photoUrl = await getPhotoUrl(message.photo);
        await sendPhoto(Number(OWNER_ID), photoUrl, `📸 <b>CUSTOMER SENT A PHOTO</b>\n\n👤 ${from.first_name} ${from.last_name || ''}\n🆔 <code>${telegramId}</code>${from.username ? `\n👤 @${from.username}` : ''}\n💬 ${text || ''}`);
      } catch {}
      await sendMessage(telegramId, lang === 'am' ? '📸 ቶን አይለሁ! ዙኙ በቅርቡ ይመልሳል።' : "📸 I've shared your photo with our design team! They'll get back to you shortly. 👌");
      return NextResponse.json({ ok: true });
    }

    if (!text) return NextResponse.json({ ok: true });

    // ── LEAD INTELLIGENCE (HOT / WARM / COLD) ──
    try {
      const score = LeadScoreService.score(text);
      if (score.temp !== 'COLD') {
        const lead = await LeadService.createLead({
          telegram_user_id: user?.id || null, conversation_id: convo?.id || null, telegram_id: telegramId,
          customer_name: `${from.first_name} ${from.last_name || ''}`, message: text, language: lang,
          priority: score.temp === 'HOT' ? 'urgent' : 'normal', source: 'telegram',
          budget_range: score.budget ? `${score.budget} ETB` : null,
          delivery_location: score.location || null, product_name: score.interest || null,
        });
        try { if (lead?.id) await supabase.from('leads').update({ temperature: score.temp }).eq('id', lead.id); } catch {}

        if (score.temp === 'HOT') {
          await sendMessage(Number(OWNER_ID),
            `🔥 <b>HOT LEAD DETECTED!</b>\n━━━━━━━━━━━━━━━━━━\n👤 ${from.first_name} ${from.last_name || ''}\n🛋️ Interested in: ${score.interest || 'Furniture'}\n💰 Est. budget: ${score.budget ? score.budget + ' ETB' : 'Unknown'}\n📍 Location: ${score.location || 'Unknown'}\n💬 "${text}"\n🆔 <code>${telegramId}</code>`,
            { reply_markup: { inline_keyboard: [[{ text: '💬 Message Customer', url: `tg://user?id=${telegramId}` }]] } });
        }
      }
    } catch {}

    // ── AI CONSULTANT ──
    const reply = await generateAIResponse(text, lang);
    await sendMessage(telegramId, reply);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export const runtime = 'nodejs';