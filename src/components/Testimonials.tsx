'use client';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('testimonials').select('*').order('created_at', { ascending: false }).limit(3).then(({ data }) => data && setTestimonials(data));
  }, []);

  return (
    <section id="journal" className="py-32 px-8 lg:px-16 border-t border-cream/5">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px w-12 bg-champagne" />
          <span className="text-xs tracking-[0.4em] uppercase text-champagne">04 — Testimonials</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-display text-cream mb-20 leading-[0.95]">
          Words from our <span className="italic champagne-text">clients.</span>
        </h2>

        <div className="space-y-24">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="grid lg:grid-cols-12 gap-12 items-start"
            >
              {/* Large quote number */}
              <div className="lg:col-span-2">
                <p className="text-6xl font-display italic champagne-text">
                  0{i + 1}
                </p>
              </div>

              {/* Quote */}
              <div className="lg:col-span-8">
                <p className="text-3xl md:text-4xl font-display leading-[1.3] text-cream/90 italic">
                  "{t.text}"
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="h-px w-8 bg-champagne" />
                  <p className="text-sm tracking-[0.2em] uppercase text-muted">{t.name}</p>
                </div>
              </div>

              {/* Small decoration */}
              <div className="lg:col-span-2 text-right">
                <span className="text-5xl champagne-text">✦</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}