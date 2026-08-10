'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { config } from '@/lib/config';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 px-8 lg:px-16">
      <div className="max-w-[1600px] mx-auto w-full grid lg:grid-cols-12 gap-12 items-center">
        {/* Left: Editorial text */}
        <div className="lg:col-span-6 lg:col-start-1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="flex items-center gap-4 mb-10"
          >
            <div className="h-px w-12 bg-champagne" />
            <span className="text-xs tracking-[0.4em] uppercase text-champagne">
              Collection MMXXVI
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.5 }}
            className="text-5xl md:text-7xl lg:text-8xl font-display leading-[0.95] text-cream text-balance"
          >
            Furniture as
            <br />
            <span className="italic champagne-text">heirloom.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.9 }}
            className="mt-10 text-lg text-muted max-w-md leading-relaxed"
          >
            Hand-finished in our Addis Ababa atelier. Solid hardwood, Italian leather, 
            and the patience of master craftsmen — built to outlive generations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-12 flex flex-wrap items-center gap-8"
          >
            <a href="#collection" className="champagne-btn">View Collection</a>
            <a href="#craft" className="text-xs tracking-[0.3em] uppercase text-cream/70 hover:text-champagne transition-colors border-b border-champagne/30 pb-1">
              Our Craftsmanship →
            </a>
          </motion.div>

          {/* Atelier details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.5 }}
            className="mt-20 pt-8 border-t border-cream/10 grid grid-cols-3 gap-8 max-w-md"
          >
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted mb-2">Atelier</p>
              <p className="text-sm text-cream">Addis Ababa</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted mb-2">Since</p>
              <p className="text-sm text-cream">2014</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted mb-2">Pieces</p>
              <p className="text-sm text-cream">1,200+</p>
            </div>
          </motion.div>
        </div>

        {/* Right: Editorial image with badge */}
        <div className="lg:col-span-5 lg:col-start-8 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.4 }}
            className="relative"
          >
            {/* Image */}
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=95"
                alt="Signature Sofa"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/40 via-transparent to-transparent" />
            </div>

            {/* Signature label */}
            <div className="absolute bottom-8 left-8 right-8 glass p-6">
              <p className="text-[10px] tracking-[0.3em] uppercase text-champagne mb-2">Signature Piece</p>
              <p className="text-xl font-display text-cream italic">The Langano Sofa</p>
              <div className="flex justify-between items-end mt-4">
                <span className="text-sm text-muted">Ethiopian hardwood</span>
                <span className="champagne-text text-lg font-display">From 85,000 ETB</span>
              </div>
            </div>

            {/* Rotating seal */}
            <div className="absolute -top-8 -right-8 w-28 h-28 slow-spin">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <path id="seal" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
                </defs>
                <text className="fill-champagne text-[7px] tracking-[0.25em] uppercase">
                  <textPath href="#seal">
                    ATELIER • EST. 2014 • ADDIS ABABA • HANDCRAFTED •
                  </textPath>
                </text>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-champagne text-2xl">✦</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}