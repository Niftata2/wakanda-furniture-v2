import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ProductService } from '@/services/product.service';
import { LeadService } from '@/services/lead.service';
import { RateLimitService } from '@/services/rate-limit.service';
import { IntentService } from '@/services/intent.service';

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

async function answerCallback(id: string, text = '') {
  try { await fetch(`${TELEGRAM_API}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: id, text }) }); } catch {}
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

function mainMenuKeyboard(lang: 'en' | 'am') {
  const items = lang === 'am'
    ? [['🛋️ የቤት ዕቃዎች', 'browse'], ['✨ ምክር', 'reco'], ['🛒 ትዕዛዝ', 'order'], ['🎨 ልዩ ትዕዛዝ', 'custom'], ['💬 ጥያቄ', 'ask'], ['👨‍💼 ሰው', 'human']]
    : [['🛋️ Browse Furniture', 'browse'], ['✨ Recommendations', 'reco'], ['🛒 Place Order', 'order'], ['🎨 Custom Furniture', 'custom'], ['💬 Ask Question', 'ask'], ['👨‍💼 Talk to Human', 'human']];
  return { inline_keyboard: items.map(([t, d]) => [{ text: t, callback_data: d }]) };
}

async function showProductCard(chatId: number, p: any, lang: 'en' | 'am') {
  const price = p.price?.toLocaleString() || 'Contact';
  const caption = `🛋️ <b>${p.name}</b>\n📂 ${p.category}\n💰 <b>${price} ETB</b>${p.short_description ? `\n\n${p.short_description}` : ''}`;
  await sendPhoto(chatId, p.image_url, caption, {
    reply_markup: { inline_keyboard: [[{ text: '🛒 Order This', callback_data: `buy_${p.id}` }, { text: '💬 Ask', callback_data: `a_${p.id}` }], [{ text: '◀️ Back', callback_data: 'browse' }]] }
  });
}

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

      // 🛒 START CHECKOUT
      if (data.startsWith('buy_')) {
        const productId = data.replace('buy_', '');
        try {
          await supabase.from('conversations').update({ checkout_step: 'awaiting_name', cart_product_id: productId }).eq('id', convo.id);
          await sendMessage(from.id, "Great choice! 👍\n\nWhat name should I put on the order?");
        } catch {}
        return NextResponse.json({ ok: true });
      }

      // ✅ CONFIRM ORDER
      if (data === 'confirm_order') {
        try {
          const { data: orderData } = await supabase.from('orders').insert({
            telegram_user_id: user.id, conversation_id: convo.id, product_id: convo.cart_product_id,
            product_name: convo.order_product_name, customer_name: convo.order_name, customer_phone: convo.order_phone, delivery_location: convo.order_location
          }).select().single();

          await supabase.from('conversations').update({ checkout_step: null, cart_product_id: null, order_name: null, order_phone: null, order_location: null }).eq('id', convo.id);
          
          await sendMessage(from.id, "✅ <b>Order Confirmed!</b>\n\nThank you! The Wakanda Furniture team has received your order and will contact you shortly to finalize delivery. 🙏");

          // 🚨 NOTIFY OWNER
          const ownerMsg = `🚨 <b>NEW ORDER RECEIVED!</b>\n━━━━━━━━━━━━━━━━━━\n🛋️ <b>${orderData.product_name}</b>\n\n👤 Customer: ${orderData.customer_name}\n📱 Phone: ${orderData.customer_phone}\n📍 Delivery: ${orderData.delivery_location}\n━━━━━━━━━━━━━━━━━━\n🆔 User ID: <code>${from.id}</code>\n👤 Username: ${from.username ? '@' + from.username : 'None'}\n\n[📞 Contact Customer](tg://user?id=${from.id})`;
          await sendMessage(Number(OWNER_ID), ownerMsg, { reply_markup: { inline_keyboard: [[{ text: '✅ Accept', callback_data: `acc_${orderData.id}` }, { text: '❌ Reject', callback_data: `rej_${orderData.id}` }]] } });
        } catch (e) { await sendMessage(from.id, "⚠️ Error saving order. Please contact support."); }
        return NextResponse.json({ ok: true });
      }

      // (Keep other callbacks like browse, reco, custom, etc. here from previous code)
      if (data === 'browse') {
        const cats = await ProductService.getCategories();
        await sendMessage(from.id, '📂 Choose a category:', { reply_markup: { inline_keyboard: cats.map((c: any) => [{ text: `${c.emoji || '🛋️'} ${c.name}`, callback_data: `cat_${c.name}` }]) } });
      } else if (data.startsWith('cat_')) {
        const prods = await ProductService.getProductsByCategory(data.replace('cat_', ''), 5);
        for (const p of prods) await showProductCard(from.id, p, 'en');
      }

      return NextResponse.json({ ok: true });
    }

    // ── REGULAR MESSAGES ──
    const message = update.message;
    if (!message || !message.from || message.from.is_bot) return NextResponse.json({ ok: true });

    const telegramId = message.chat.id;
    const from = message.from;
    const text = message.text || '';

    let user: any = null; let convo: any = null;
    try {
      user = await getOrCreateUser(telegramId, from.first_name, from.last_name, from.username);
      if (user) convo = await getOrCreateConversation(telegramId, user.id);
    } catch {}

    if (text.startsWith('/start')) {
      if (convo) await supabase.from('conversations').update({ checkout_step: null }).eq('id', convo.id); // Reset checkout on /start
      await sendMessage(telegramId, '👋 Welcome to Wakanda Furniture!\n\nI am your personal AI consultant. How can I help you today?', { reply_markup: mainMenuKeyboard('en') });
      return NextResponse.json({ ok: true });
    }

    // 🛒 SMART CHECKOUT STATE MACHINE
    if (convo?.checkout_step) {
      if (convo.checkout_step === 'awaiting_name') {
        await supabase.from('conversations').update({ checkout_step: 'awaiting_phone', order_name: text }).eq('id', convo.id);
        await sendMessage(telegramId, `Perfect, <b>${text}</b>.\n\nAnd what phone number should our team use to contact you?`);
        return NextResponse.json({ ok: true });
      }
      if (convo.checkout_step === 'awaiting_phone') {
        await supabase.from('conversations').update({ checkout_step: 'awaiting_location', order_phone: text }).eq('id', convo.id);
        await sendMessage(telegramId, "Got it. 📱\n\nWhere should we deliver it? (e.g., Bole, Hawassa, or specific area)");
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

    // 🧠 AI CONSULTANT FALLBACK
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (GEMINI_KEY && text) {
      let prodList = '';
      try { const products = await ProductService.getFeaturedProducts(8); prodList = products.map(p => `- ${p.name}: ${p.price?.toLocaleString()} ETB`).join('\n'); } catch {}
      
      const prompt = `You are a premium furniture sales consultant for Wakanda Furniture in Ethiopia. Speak natural English. Keep messages short (under 4 sentences). If they want to buy, tell them to click the [Order This] button on the product. Available Products:\n${prodList}\n\nCustomer: ${text}\nResponse:`;
      
      try {
        const res = await withRetry(() => fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }));
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Let me connect you with our team!';
        await sendMessage(telegramId, reply);
      } catch { await sendMessage(telegramId, 'Sorry, I am having trouble connecting right now. Please try again.'); }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
export const runtime = 'nodejs';