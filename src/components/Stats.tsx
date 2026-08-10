'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 2400;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

const stats = [
  { to: 12, suffix: '', label: 'Years of the Atelier' },
  { to: 1200, suffix: '+', label: 'Commissioned Pieces' },
  { to: 98, suffix: '%', label: 'Client Retention' },
  { to: 5, suffix: '', label: 'Year Guarantee' },
];

export default function Stats() {
  return (
    <section className="py-24 px-8 lg:px-16 border-t border-cream/5">
      <div className="max-w-[1600px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-y-16">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: i * 0.12 }}
            className={`text-center ${i > 0 ? 'lg:border-l lg:border-cream/10' : ''}`}
          >
            <p className="text-5xl md:text-6xl font-display champagne-text">
              <Counter to={s.to} suffix={s.suffix} />
            </p>
            <p className="mt-4 text-[10px] tracking-[0.35em] uppercase text-muted">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}