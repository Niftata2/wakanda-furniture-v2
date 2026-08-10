'use client';
import { motion } from 'framer-motion';

const rows = [
  { n: '01', t: 'Solid Ethiopian Hardwood', d: 'Sourced from sustainable forests, air-dried for twenty-four months, and joined without a single visible screw.' },
  { n: '02', t: 'Hand-Stitched Leather', d: 'Full-grain hides cut and stitched by hand in our Addis atelier. Never glued. Never rushed.' },
  { n: '03', t: 'Made to Your Measure', d: 'Every silhouette can be resized, rewooded, or refinished. Your home sets the dimensions — not our catalogue.' },
  { n: '04', t: 'The Five-Year Promise', d: 'If a joint ever loosens or a seam ever parts, we restore it in our atelier. No questions asked.' },
];

export default function Craftsmanship() {
  return (
    <section id="craft" className="py-32 px-8 lg:px-16 border-t border-cream/5">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px w-12 bg-champagne" />
          <span className="text-xs tracking-[0.4em] uppercase text-champagne">02 — Craftsmanship</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-display text-cream leading-[0.95] mb-20 max-w-3xl">
          The patience of the <span className="italic champagne-text">atelier.</span>
        </h2>

        <div>
          {rows.map((r, i) => (
            <motion.div
              key={r.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group grid md:grid-cols-12 gap-6 md:gap-12 py-12 border-t border-cream/10 hover:pl-6 transition-all duration-700"
            >
              <div className="md:col-span-2">
                <p className="text-5xl md:text-6xl font-display italic text-champagne/30 group-hover:text-champagne transition-colors duration-700">
                  {r.n}
                </p>
              </div>
              <div className="md:col-span-4">
                <h3 className="text-2xl md:text-3xl font-display text-cream italic">{r.t}</h3>
              </div>
              <div className="md:col-span-5">
                <p className="text-muted leading-relaxed">{r.d}</p>
              </div>
              <div className="md:col-span-1 hidden md:flex items-start justify-end">
                <span className="text-champagne/0 group-hover:text-champagne transition-all duration-700 text-2xl">✦</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}