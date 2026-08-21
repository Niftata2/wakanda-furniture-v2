import { supabase } from '@/lib/supabase';

export const metadata = {
  title: 'Wakanda Furniture | Atelier de Luxe',
  description: 'Premium handcrafted furniture in Ethiopia. Sofas, beds, dining sets and custom royal designs.',
};

export const dynamic = 'force-dynamic';

export default async function Home() {
  let products: any[] = [];
  try {
    const { data } = await supabase.from('products').select('*').eq('is_featured', true).limit(6);
    products = data || [];
  } catch {}

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-amber-500/20">
        <div className="text-xl font-black tracking-widest text-amber-400">👑 WAKANDA FURNITURE</div>
        <a href="https://t.me/WakandaaFurniture_Bot" className="text-sm border border-amber-500/40 rounded-lg px-4 py-2 text-amber-300 hover:bg-amber-500/10">💬 Chat with our AI</a>
      </header>

      <section className="px-6 md:px-12 py-20 text-center">
        <p className="text-amber-500/80 tracking-[0.3em] text-xs mb-4">ATELIER DE LUXE — ADDIS ABABA</p>
        <h1 className="text-4xl md:text-6xl font-black text-amber-400 mb-6">Furniture Fit for Royalty.</h1>
        <p className="text-zinc-400 max-w-2xl mx-auto mb-10">
          Handcrafted sofas, beds and dining sets. Order in seconds through our AI consultant on Telegram — in English or Amharic.
        </p>
        <a href="https://t.me/WakandaaFurniture_Bot" className="inline-block bg-amber-500 text-black font-bold rounded-xl px-8 py-4 hover:bg-amber-400">
          🛋️ Start Shopping on Telegram
        </a>
      </section>

      <section className="px-6 md:px-12 pb-20">
        <h2 className="text-2xl font-bold text-amber-300 mb-8">✨ Featured Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p: any) => (
            <div key={p.id} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
              <img src={p.image_url} alt={p.name} className="w-full h-52 object-cover" />
              <div className="p-5">
                <div className="font-semibold text-amber-300">{p.name}</div>
                <div className="text-xs text-zinc-500 mb-2">{p.category}</div>
                <div className="font-black text-white">{Number(p.price).toLocaleString()} ETB</div>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="text-zinc-500">New collection dropping soon.</p>}
        </div>
      </section>

      <footer className="px-6 md:px-12 py-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between text-xs text-zinc-600">
        <span>© 2026 Wakanda Furniture — Addis Ababa, Ethiopia</span>
        <a href="/admin" className="hover:text-amber-400">Owner Area 🔒</a>
      </footer>
    </main>
  );
}