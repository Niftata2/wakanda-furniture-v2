'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Tab = 'overview' | 'leads' | 'products' | 'messages' | 'analytics';

export default function AdminDashboard() {
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  // Data
  const [leads, setLeads] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalLeads: 0, newLeads: 0, qualifiedLeads: 0,
    totalProducts: 0, inStock: 0, messages: 0,
    productViews: 0, orders: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsAuth(!!data.session));
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    refreshAll();
  }, [isAuth]);

  async function refreshAll() {
    const [l, p, m, a] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(500),
    ]);

    const leadsData = l.data || [];
    const prodsData = p.data || [];
    const msgsData = m.data || [];
    const analyticsData = a.data || [];

    setLeads(leadsData);
    setProducts(prodsData);
    setMessages(msgsData);
    setAnalytics(analyticsData);

    setStats({
      totalLeads: leadsData.length,
      newLeads: leadsData.filter(x => x.status === 'new').length,
      qualifiedLeads: leadsData.filter(x => x.status === 'qualified').length,
      totalProducts: prodsData.length,
      inStock: prodsData.filter(x => x.in_stock).length,
      messages: msgsData.length,
      productViews: analyticsData.filter(x => x.event_type === 'product_viewed').length,
      orders: analyticsData.filter(x => x.event_type === 'lead_created').length,
    });
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setIsAuth(true); else alert('Invalid credentials');
  }

  async function updateLeadStatus(id: string, status: string) {
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    refreshAll();
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return;
    await supabase.from('leads').delete().eq('id', id);
    refreshAll();
  }

  async function addProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get('image') as File;
    let url = '';
    if (file && file.size > 0) {
      const name = `${Date.now()}-${file.name}`;
      await supabase.storage.from('product-images').upload(name, file);
      url = supabase.storage.from('product-images').getPublicUrl(name).data.publicUrl;
    }
    await supabase.from('products').insert([{
      name: fd.get('name'),
      category: fd.get('category'),
      price: parseFloat(fd.get('price') as string),
      image_url: url,
      in_stock: fd.get('in_stock') === 'on',
      is_featured: fd.get('featured') === 'on',
      short_description: fd.get('desc'),
    }]);
    e.currentTarget.reset();
    refreshAll();
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    refreshAll();
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center p-4">
        <form onSubmit={login} className="glass p-10 rounded-2xl w-full max-w-md space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">👑</div>
            <h1 className="text-3xl font-display champagne-text">Admin Portal</h1>
          </div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 glass rounded-xl text-cream" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 glass rounded-xl text-cream" required />
          <button type="submit" className="champagne-btn w-full">Login</button>
        </form>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'leads', label: `Leads (${stats.newLeads})`, icon: '🔥' },
    { id: 'products', label: 'Products', icon: '🛋️' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-noir p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-display champagne-text">Admin Dashboard</h1>
            <p className="text-muted text-sm mt-1">Wakanda Furniture Control Room</p>
          </div>
          <div className="flex gap-3">
            <button onClick={refreshAll} className="px-4 py-2 glass rounded-xl text-cream hover:border-champagne/40">↻ Refresh</button>
            <button onClick={() => supabase.auth.signOut().then(() => setIsAuth(false))} className="px-4 py-2 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10">Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap transition-all ${tab === t.id ? 'champagne-btn' : 'glass text-cream/70 hover:border-champagne/40'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ───── OVERVIEW ───── */}
          {tab === 'overview' && (
            <motion.div key="o" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'New Leads', value: stats.newLeads, icon: '🔥', color: 'champagne' },
                  { label: 'Qualified', value: stats.qualifiedLeads, icon: '⭐', color: 'green-400' },
                  { label: 'Products', value: stats.totalProducts, icon: '🛋️', color: 'blue-400' },
                  { label: 'Product Views', value: stats.productViews, icon: '👁️', color: 'purple-400' },
                  { label: 'Orders', value: stats.orders, icon: '🛒', color: 'emerald-400' },
                  { label: 'In Stock', value: stats.inStock, icon: '✅', color: 'green-400' },
                  { label: 'Messages', value: stats.messages, icon: '💬', color: 'amber-400' },
                  { label: 'Total Leads', value: stats.totalLeads, icon: '📊', color: 'champagne' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass p-6 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-xs text-muted uppercase tracking-wider">{s.label}</span>
                    </div>
                    <div className={`text-4xl font-display text-${s.color}`}>{s.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* Recent Leads */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-2xl font-display champagne-text mb-4">Recent Leads</h2>
                <div className="space-y-3">
                  {leads.slice(0, 5).map(l => (
                    <div key={l.id} className="flex items-center justify-between p-4 bg-noir/50 rounded-xl">
                      <div>
                        <p className="font-bold text-cream">{l.customer_name}</p>
                        <p className="text-sm text-muted">{l.product_name} · {l.phone}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        l.status === 'new' ? 'bg-champagne/20 text-champagne' :
                        l.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' :
                        l.status === 'qualified' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{l.status}</span>
                    </div>
                  ))}
                  {leads.length === 0 && <p className="text-muted text-center py-8">No leads yet</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ───── LEADS ───── */}
          {tab === 'leads' && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface">
                      <tr>
                        <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Customer</th>
                        <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Phone</th>
                        <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Product</th>
                        <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Priority</th>
                        <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Status</th>
                        <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map(l => (
                        <tr key={l.id} className="border-t border-cream/5 hover:bg-surface/50">
                          <td className="p-4">
                            <p className="text-cream">{l.customer_name}</p>
                            <p className="text-xs text-muted">{new Date(l.created_at).toLocaleDateString()}</p>
                          </td>
                          <td className="p-4 text-champagne">{l.phone || '—'}</td>
                          <td className="p-4">{l.product_name || '—'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              l.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                              l.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-cream/10 text-cream/70'
                            }`}>{l.priority}</span>
                          </td>
                          <td className="p-4">
                            <select
                              value={l.status}
                              onChange={e => updateLeadStatus(l.id, e.target.value)}
                              className="bg-surface text-cream text-xs px-2 py-1 rounded border border-cream/10"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="converted">Converted</option>
                              <option value="lost">Lost</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <button onClick={() => deleteLead(l.id)} className="text-red-400 text-sm hover:text-red-300">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {leads.length === 0 && <p className="text-center text-muted py-12">No leads yet</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ───── PRODUCTS ───── */}
          {tab === 'products' && (
            <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <form onSubmit={addProduct} className="glass rounded-2xl p-6 mb-6 grid md:grid-cols-2 gap-4">
                <h3 className="md:col-span-2 text-xl font-display champagne-text mb-2">Add Product</h3>
                <input name="name" placeholder="Name" className="p-3 glass rounded-xl text-cream" required />
                <input name="category" placeholder="Category" className="p-3 glass rounded-xl text-cream" required />
                <input name="price" type="number" placeholder="Price (ETB)" className="p-3 glass rounded-xl text-cream" required />
                <input name="desc" placeholder="Short description" className="p-3 glass rounded-xl text-cream" />
                <input type="file" name="image" accept="image/*" className="p-3 glass rounded-xl text-cream md:col-span-2" required />
                <div className="md:col-span-2 flex gap-6">
                  <label className="flex items-center gap-2 text-cream"><input type="checkbox" name="in_stock" defaultChecked /> In Stock</label>
                  <label className="flex items-center gap-2 text-cream"><input type="checkbox" name="featured" /> Featured</label>
                </div>
                <button type="submit" className="champagne-btn md:col-span-2">Add Product</button>
              </form>

              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-surface">
                    <tr>
                      <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Product</th>
                      <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Category</th>
                      <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Price</th>
                      <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Stock</th>
                      <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-t border-cream/5">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {p.image_url && <img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded" />}
                            <span className="text-cream">{p.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted">{p.category}</td>
                        <td className="p-4 text-champagne">{p.price?.toLocaleString()} ETB</td>
                        <td className="p-4">
                          <span className={p.in_stock ? 'text-green-400' : 'text-red-400'}>
                            {p.in_stock ? '✓ In' : '✗ Out'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button onClick={() => deleteProduct(p.id)} className="text-red-400 text-sm">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ───── MESSAGES ───── */}
          {tab === 'messages' && (
            <motion.div key="m" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="glass rounded-2xl overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface">
                    <tr>
                      <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Name</th>
                      <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Phone</th>
                      <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Message</th>
                      <th className="p-4 text-left text-xs uppercase tracking-wider text-muted">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map(m => (
                      <tr key={m.id} className="border-t border-cream/5">
                        <td className="p-4 text-cream">{m.name}</td>
                        <td className="p-4 text-champagne">{m.phone}</td>
                        <td className="p-4 text-muted">{m.message}</td>
                        <td className="p-4 text-muted text-xs">{new Date(m.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ───── ANALYTICS ───── */}
          {tab === 'analytics' && (
            <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Event breakdown */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-xl font-display champagne-text mb-4">Events Breakdown</h3>
                  {Object.entries(
                    analytics.reduce((acc: any, e) => {
                      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]: any) => (
                      <div key={type} className="flex items-center justify-between py-2 border-b border-cream/5">
                        <span className="text-cream/80 text-sm">{type}</span>
                        <span className="champagne-text font-bold">{count}</span>
                      </div>
                    ))}
                </div>

                <div className="glass rounded-2xl p-6">
                  <h3 className="text-xl font-display champagne-text mb-4">Top Viewed Products</h3>
                  {Object.entries(
                    analytics
                      .filter(e => e.event_type === 'product_viewed' && e.product_id)
                      .reduce((acc: any, e) => {
                        acc[e.product_id] = (acc[e.product_id] || 0) + 1;
                        return acc;
                      }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([productId, count]: any) => {
                      const prod = products.find(p => p.id === productId);
                      return (
                        <div key={productId} className="flex items-center justify-between py-2 border-b border-cream/5">
                          <span className="text-cream/80 text-sm">{prod?.name || 'Unknown'}</span>
                          <span className="champagne-text font-bold">{count} views</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Recent activity */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-display champagne-text mb-4">Recent Activity</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {analytics.slice(0, 50).map(e => (
                    <div key={e.id} className="flex items-center justify-between py-2 px-3 bg-noir/50 rounded text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-muted text-xs font-mono">
                          {new Date(e.created_at).toLocaleTimeString()}
                        </span>
                        <span className="text-cream">{e.event_type}</span>
                      </div>
                      <span className="text-muted text-xs">ID: {e.telegram_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}