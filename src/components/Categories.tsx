'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

const rooms = [
  { name: 'The Living Room', note: 'Sofas & lounge, built for gathering', img: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=900&q=90' },
  { name: 'The Bedroom', note: 'Beds & wardrobes in quiet hardwood', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=90' },
  { name: 'The Dining Room', note: 'Tables that host a generation', img: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=900&q=90' },
  { name: 'The Study', note: 'Desks & libraries for deep work', img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=900&q=90' },
];

export default function Categories() {
  return (
    <section id="rooms" className="py-32 px-8 lg:px-16 border-t border-cream/5">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px w-12 bg-champagne" />
          <span className="text-xs tracking-[0.4em] uppercase text-champagne">03 — The Rooms</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
          <h2 className="text-5xl md:text-7xl font-display text-cream leading-[0.95]">
            Composed by <span className="italic champagne-text">room.</span>
          </h2>
          <p className="text-muted max-w-sm text-sm leading-relaxed">
            Every commission begins with the room itself — its light, its proportions, its life.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {rooms.map((r, i) => (
            <motion.a
              key={r.name}
              href="#collection"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="group block"
            >
              <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-surface">
                <Image
                  src={r.img}
                  alt={r.name}
                  fill
                  className="object-cover transition-all duration-[1.4s] ease-out group-hover:scale-105 group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-champagne opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    Discover →
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-display text-cream italic group-hover:text-champagne transition-colors duration-500">
                {r.name}
              </h3>
              <p className="text-sm text-muted mt-2">{r.note}</p>
              <div className="h-px bg-cream/10 mt-6 group-hover:bg-champagne/40 transition-colors duration-500" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}