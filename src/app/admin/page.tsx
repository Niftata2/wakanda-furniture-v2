'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const ADMIN_KEY = 'wakanda2026';
const STATUSES = ['NEW', 'CONFIRMED', 'IN_PRODUCTION', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const STATUS_COLORS: any = {
  NEW: 'bg-yellow-500/20 text-yellow-400', CONFIRMED: 'bg-blue-500/20 text-blue-400',
  IN_PRODUCTION: 'bg-purple-500/20 text-purple-400', OUT_FOR_DELIVERY: 'bg-orange-500/20 text-orange-400',
  DELIVERED: 'bg-green-500/20 text-green-400', CANCELLED: 'bg-red-500/20 text-red-400',
};
const TEMP_BADGE: any = { HOT: '🔥 HOT', WARM: '🟠 WARM', COLD: '🔵 COLD' };

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [leadFilter, setLeadFilter] = useState('ALL');

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('key');
    if (key === ADMIN_KEY) { setAuthed(true); loadData(); } else setLoading(false);
  }, []);

  async function loadData() {
    try {
      const [o, l, p, c] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*'),
        supabase.from('telegram_users').select('*'),
      ]);
      setOrders(o.data || []); setLeads(l.data || []); setProducts(p.data || []); setCustomers(c.data || []);
    } catch {}
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    try { await supabase.from('orders').update({ status }).eq('id', id); loadData(); } catch {}
  }

  function exportCSV() {
    const rows = [['Product', 'Customer', 'Phone', 'Location', 'Status', 'Date'],
      ...orders.map(o => [o.product_name, o.customer_name, o.customer_phone, o.delivery_location, o.status, new Date(o.created_at).toLocaleString()])];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'wakanda-orders.csv';
    a.click();
  }

  if (loading) return <div className="min-h-screen bg-black text-amber-400 flex items-center justify-center">Loading Wakanda HQ — Hawassa...</div>;

  if (!authed) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center border border-amber-500/30 rounded-2xl p-10 bg-zinc-950">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-amber-400 mb-1">Wakanda Furniture — Owner Area</h1>
        <p className="text-xs text-zinc-500 mb-3">📍 Hawassa, Ethiopia 🇪🇹</p>
        <p className="text-zinc-400 text-sm">This area is restricted. Add your access key to the URL:<br /><code className="text-amber-300">/admin?key=YOUR_KEY</code></p>
      </div>
    </div>
  );

  const today = new Date().toDateString();
  const ordersToday = orders.filter(o => new Date(o.created_at).toDateString() === today);
  const pending = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const hotLeads = leads.filter(l => l.temperature === 'HOT');
  const priceOf = (o: any) => products.find(p => p.name === o.product_name)?.price || 0;
  const revenue = orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + priceOf(o), 0);
  const avgOrder = orders.length ? Math.round(revenue / orders.length) : 0;
  const conversion = customers.length ? Math.round((orders.length / customers.length) * 100) : 0;

  const productCounts: Record<string, number> = {};
  orders.forEach(o => { productCounts[o.product_name] = (productCounts[o.product_name] || 0) + 1; });
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const filteredOrders = orders.filter(o => !q || `${o.customer_name} ${o.product_name}`.toLowerCase().includes(q.toLowerCase()));
  const filteredLeads = leadFilter === 'ALL' ? leads : leads.filter(l => l.temperature === leadFilter);

  const tabs = [['overview', '📊 Overview'], ['orders', '🛒 Orders'], ['leads', '🔥 Leads'], ['products', '🛋️ Products'], ['customers', '👥 Customers'], ['analytics', '📈 Analytics']];

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-amber-400 tracking-wide">👑 WAKANDA FURNITURE — HQ</h1>
          <p className="text-xs text-zinc-500 mt-1">📍 Hawassa, Ethiopia 🇪🇹</p>
        </div>
        <button onClick={loadData} className="text-sm border border-amber-500/40 rounded-lg px-4 py-2 text-amber-300 hover:bg-amber-500/10">↻ Refresh</button>
      </div>

      <div className="flex gap-2 flex-wrap mb-8">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${tab === id ? 'bg-amber-500 text-black border-amber-500' : 'border-zinc-700 text-zinc-300 hover:border-amber-500/50'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[
              ['🛒 Orders Today', ordersToday.length], ['💰 Pipeline Revenue', `${revenue.toLocaleString()} ETB`],
              ['⏳ Pending Orders', pending.length], ['🔥 Hot Leads', hotLeads.length], ['👥 Customers', customers.length],
            ].map(([label, value]) => (
              <div key={label as string} className="border border-amber-500/20 bg-zinc-950 rounded-2xl p-5">
                <div className="text-zinc-400 text-xs mb-2">{label}</div>
                <div className="text-xl md:text-2xl font-black text-amber-400">{value}</div>
              </div>
            ))}
          </div>
          <h2 className="text-lg font-bold text-amber-300 mb-4">Latest Activity</h2>
          <div className="space-y-3">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-950 flex justify-between items-center">
                <div><div className="font-semibold">🛒 {o.product_name} — {o.customer_name}</div><div className="text-xs text-zinc-500">{o.delivery_location} • {new Date(o.created_at).toLocaleString()}</div></div>
                <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[o.status] || 'bg-zinc-700'}`}>{o.status}</span>
              </div>
            ))}
            {leads.slice(0, 5).map(l => (
              <div key={l.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-950 flex justify-between items-center">
                <div><div className="font-semibold">{TEMP_BADGE[l.temperature] || '🔵 COLD'} {l.customer_name}</div><div className="text-xs text-zinc-500">"{l.message}"</div></div>
                <span className="text-xs text-zinc-500">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'orders' && (
        <div>
          <div className="flex flex-col md:flex-row gap-3 mb-5 items-start md:items-center justify-between">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Search customer or product..."
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-sm w-full md:w-80 focus:border-amber-500 outline-none" />
            <button onClick={exportCSV} className="text-sm border border-amber-500/40 rounded-lg px-4 py-2 text-amber-300 hover:bg-amber-500/10">📥 Export CSV (Excel)</button>
          </div>
          <div className="space-y-3">
            {filteredOrders.length === 0 && <p className="text-zinc-500">No orders found.</p>}
            {filteredOrders.map(o => (
              <div key={o.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-950 grid md:grid-cols-5 gap-3 items-center">
                <div><div className="text-xs text-zinc-500">Product</div><div className="font-semibold text-amber-300">{o.product_name}</div></div>
                <div><div className="text-xs text-zinc-500">Customer</div><div>{o.customer_name}<div className="text-xs text-zinc-500">{o.customer_phone}</div></div></div>
                <div><div className="text-xs text-zinc-500">Delivery</div><div>{o.delivery_location}</div></div>
                <div><div className="text-xs text-zinc-500">Date</div><div className="text-xs">{new Date(o.created_at).toLocaleString()}</div></div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Status (change here)</div>
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                    className="text-xs rounded-lg px-3 py-2 border border-zinc-700 bg-zinc-900 outline-none focus:border-amber-500">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'leads' && (
        <div>
          <div className="flex gap-2 mb-5">
            {['ALL', 'HOT', 'WARM', 'COLD'].map(f => (
              <button key={f} onClick={() => setLeadFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border ${leadFilter === f ? 'bg-amber-500 text-black border-amber-500' : 'border-zinc-700 text-zinc-300'}`}>
                {f === 'ALL' ? '🌐 ALL' : TEMP_BADGE[f]}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredLeads.length === 0 && <p className="text-zinc-500">No leads in this filter.</p>}
            {filteredLeads.map(l => (
              <div key={l.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-950">
                <div className="flex justify-between"><span className="font-semibold">{TEMP_BADGE[l.temperature] || '🔵 COLD'} {l.customer_name}</span><span className="text-xs text-zinc-500">{new Date(l.created_at).toLocaleString()}</span></div>
                <p className="text-sm text-zinc-300 mt-1">"{l.message}"</p>
                <div className="text-xs text-amber-400/80 mt-1">{l.budget_range && `💰 ${l.budget_range} `}{l.delivery_location && `📍 ${l.delivery_location} `}{l.product_name && `🛋️ ${l.product_name}`}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="grid md:grid-cols-2 gap-4">
          {products.map(p => (
            <div key={p.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-950 flex gap-4">
              <img src={p.image_url} alt={p.name} className="w-20 h-20 rounded-lg object-cover" />
              <div><div className="font-semibold text-amber-300">{p.name}</div><div className="text-xs text-zinc-500">{p.category}</div><div className="text-sm font-bold mt-1">{Number(p.price)?.toLocaleString()} ETB</div><div className="text-xs mt-1">{p.in_stock ? '🟢 In stock' : '🔴 Out of stock'} {p.is_featured && '• ⭐ Featured'}</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'customers' && (
        <div className="space-y-3">
          {customers.map(c => (
            <div key={c.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-950 flex justify-between">
              <div className="font-semibold">{c.first_name} {c.last_name || ''} {c.username && <span className="text-xs text-zinc-500">@{c.username}</span>}</div>
              <span className="text-xs text-zinc-500">Joined {new Date(c.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-950">
            <h3 className="font-bold text-amber-300 mb-4">🏆 Most Ordered Products</h3>
            {topProducts.map(([name, count]) => (
              <div key={name} className="flex justify-between text-sm py-2 border-b border-zinc-900"><span>{name}</span><span className="text-amber-400 font-bold">{count} order(s)</span></div>
            ))}
            {topProducts.length === 0 && <p className="text-zinc-500 text-sm">No orders yet — share your bot link to start selling!</p>}
          </div>
          <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-950">
            <h3 className="font-bold text-amber-300 mb-4">🌡️ Lead Temperatures</h3>
            {['HOT', 'WARM', 'COLD'].map(t => (
              <div key={t} className="flex justify-between text-sm py-2 border-b border-zinc-900"><span>{TEMP_BADGE[t]}</span><span className="font-bold">{leads.filter(l => l.temperature === t).length}</span></div>
            ))}
            <h3 className="font-bold text-amber-300 mt-6 mb-4">📦 Orders by Status</h3>
            {STATUSES.map(s => (
              <div key={s} className="flex justify-between text-sm py-2 border-b border-zinc-900"><span>{s}</span><span className="font-bold">{orders.filter(o => o.status === s).length}</span></div>
            ))}
          </div>
          <div className="border border-amber-500/20 rounded-xl p-5 bg-zinc-950 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['📈 Conversion Rate', `${conversion}%`], ['🧾 Avg Order Value', `${avgOrder.toLocaleString()} ETB`],
              ['🛒 Total Orders', orders.length], ['🔥 HOT Lead Rate', leads.length ? `${Math.round((hotLeads.length / leads.length) * 100)}%` : '0%'],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className="text-zinc-400 text-xs mb-1">{label}</div>
                <div className="text-lg font-black text-amber-400">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-12 text-center text-xs text-zinc-600">👑 Wakanda Furniture HQ — Hawassa, Ethiopia 🇪</footer>
    </div>
  );
}