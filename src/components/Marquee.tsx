'use client';
import { motion } from 'framer-motion';

const items = ['Handcrafted', 'Solid Hardwood', 'Italian Leather', 'Made to Measure', 'Five-Year Guarantee', 'Nationwide Delivery'];

export default function Marquee() {
  return (
    <div className="py-8 overflow-hidden border-y border-cream/5">
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        className="flex w-max whitespace-nowrap"
      >
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center text-xs tracking-[0.4em] uppercase text-muted">
            <span className="px-10">{t}</span>
            <span className="text-champagne">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}