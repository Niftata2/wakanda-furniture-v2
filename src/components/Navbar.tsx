'use client';
import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';
import { config } from '@/lib/config';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  useMotionValueEvent(scrollYProgress, 'change', (v) => setIsScrolled(v > 0.02));

  const navLinks = [
    { href: '#collection', label: 'Collection' },
    { href: '#craft', label: 'Craftsmanship' },
    { href: '#rooms', label: 'Rooms' },
    { href: '#journal', label: 'Clients' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <>
      {/* Hairline scroll progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-px z-[60] origin-left"
        style={{ scaleX: scrollYProgress, background: '#c9a961' }}
      />

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ${
          isScrolled ? 'glass border-b border-champagne/10' : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-8 lg:px-16 flex items-center justify-between h-24">
          {/* ═══════════ LOGO + WORDMARK ═══════════ */}
          <Link href="/" className="flex items-center gap-4 group">
            <span className="w-12 h-12 rounded-full overflow-hidden border border-champagne/40 shadow-[0_0_25px_rgba(201,169,97,0.25)] group-hover:scale-105 transition-transform duration-500">
  <img
    src="/logo.png"
    alt="Wakanda Furniture"
    className="w-full h-full object-cover"
    style={{ transform: 'scale(1.1)', transformOrigin: '60% 39%' }}
  />
</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-12">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs tracking-[0.25em] uppercase text-cream/70 hover:text-champagne transition-colors duration-500"
              >
                {link.label}
              </a>
            ))}
          </div>

          <a href={config.contact.telegram} target="_blank" className="hidden lg:inline-block champagne-btn">
            Enquire
          </a>

          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-cream text-2xl">
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden glass border-t border-champagne/10"
            >
              <div className="px-8 py-8 space-y-6">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                    className="block text-sm tracking-[0.25em] uppercase text-cream/80 hover:text-champagne">
                    {link.label}
                  </a>
                ))}
                <a href={config.contact.telegram} target="_blank" className="champagne-btn block text-center mt-6">
                  Enquire
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}