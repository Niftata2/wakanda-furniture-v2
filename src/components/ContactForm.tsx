'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    const { error } = await supabase.from('contact_messages').insert([form]);
    if (error) {
      setStatus('idle');
      alert('Something went wrong. Please try again.');
      return;
    }
    setStatus('sent');
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  const input =
    'w-full bg-transparent border-b border-cream/20 focus:border-champagne px-1 py-4 outline-none text-cream placeholder:text-muted/60 transition-colors duration-500';

  return (
    <section id="contact" className="py-32 px-8 lg:px-16 border-t border-cream/5">
      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-16">
        {/* Left: editorial intro + atelier details */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-12 bg-champagne" />
            <span className="text-xs tracking-[0.4em] uppercase text-champagne">05 — Enquiries</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-display text-cream leading-[0.95]">
            Begin a <span className="italic champagne-text">commission.</span>
          </h2>
          <p className="text-muted mt-8 max-w-md leading-relaxed">
            Tell us about the piece you imagine. Our concierge replies within one day, 
            and a craftsman will call to discuss your commission.
          </p>

          <div className="mt-16 space-y-10">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-champagne mb-3">Atelier</p>
              <p className="text-cream/80 leading-7">
                Bole Road, Addis Ababa
                <br />
                <span className="font-amharic text-muted">ቦሌ መንገ፣ አስ አበባ</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-champagne mb-3">Hours</p>
              <p className="text-cream/80 leading-7">Monday — Saturday, 9:00 — 19:00</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-champagne mb-3">Concierge</p>
              <p className="text-cream/80 leading-7">
                {config.contact.phone}
                <br />
                {config.contact.email}
              </p>
            </div>
          </div>
        </div>

        {/* Right: the form */}
        <div className="lg:col-span-6 lg:col-start-7">
          {status === 'sent' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-champagne/30 p-16 text-center"
            >
              <p className="text-4xl champagne-text mb-6">✦</p>
              <h3 className="text-3xl font-display text-cream italic">Thank you.</h3>
              <p className="text-muted mt-4">Our concierge will reply within one day.</p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={submit}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10"
            >
              <div className="grid sm:grid-cols-2 gap-10">
                <input required className={input} placeholder="Your name" value={form.name} onChange={(e) => update('name', e.target.value)} />
                <input required type="tel" className={input} placeholder="Telephone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
              <input required type="email" className={input} placeholder="Email address" value={form.email} onChange={(e) => update('email', e.target.value)} />
              <textarea required rows={4} className={input} placeholder="Describe the piece you imagine…" value={form.message} onChange={(e) => update('message', e.target.value)} />
              <button type="submit" disabled={status === 'sending'} className="champagne-btn disabled:opacity-40">
                {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
}