'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('products').select('*').eq('is_featured', true).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setProducts(data);
      setLoading(false);
    });
  }, []);
  const createDeepLink = (productId: string) => {
  const botUsername = 'WakandaFurnitureBot'; // Your bot username without @
  return `https://t.me/${botUsername}?start=product_${productId}`;
};

  const formatPrice = (p: number) => new Intl.NumberFormat('en-US').format(p);
  const createLink = (p: any) => `${config.contact.telegram}?text=${encodeURIComponent(`Enquiry about "${p.name}" (${formatPrice(p.price)} ETB).`)}`;

  return (
    <section id="collection" className="py-32 px-8 lg:px-16">
      <div className="max-w-[1600px] mx-auto">
        {/* Editorial header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-8">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-champagne" />
              <span className="text-xs tracking-[0.4em] uppercase text-champagne">01 — The Collection</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display text-cream leading-[0.95]">
              Selected <span className="italic champagne-text">pieces</span>
            </h2>
          </div>
          <p className="text-muted max-w-sm text-sm leading-relaxed">
            Each piece in our collection is built to order in our Addis Ababa atelier, 
            finished by hand over the course of weeks — not hours.
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-[4/5] skeleton-luxury" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((p, i) => (
              <motion.a
                key={p.id}
                href={createLink(p)}
                target="_blank"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="group block cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-surface">
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-noir/60 via-transparent to-transparent opacity-60" />
                  
                  {p.badge && (
                    <div className="absolute top-6 left-6 px-3 py-1.5 bg-noir/80 backdrop-blur text-[10px] tracking-[0.3em] uppercase text-champagne">
                      {p.badge}
                    </div>
                  )}

                  {/* Enquire reveal */}
                  <div className="absolute bottom-6 right-6 px-4 py-2 bg-noir/90 backdrop-blur border border-champagne/30 text-[10px] tracking-[0.3em] uppercase text-champagne opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    Enquire →
                  </div>
                </div>
<a
  href={`https://t.me/WakandaaFurniture_Bot?start=product_${p.id}`}
  target="_blank"
  className="absolute bottom-4 left-4 champagne-btn text-xs"
>
  💬 Ask AI About This
</a>
                {/* Editorial info */}
                <div className="flex justify-between items-baseline gap-4">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted mb-2">{p.category}</p>
                    <h3 className="text-2xl font-display text-cream group-hover:text-champagne transition-colors duration-500 italic">
                      {p.name}
                    </h3>
                  </div>
                  <p className="text-lg champagne-text font-display whitespace-nowrap">
                    {formatPrice(p.price)}
                  </p>
                </div>
                <div className="h-px bg-cream/10 mt-6 group-hover:bg-champagne/40 transition-colors duration-500" />
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}