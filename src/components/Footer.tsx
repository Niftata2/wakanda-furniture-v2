'use client';
import type { ReactNode } from 'react';
import { config } from '@/lib/config';
import { motion } from 'framer-motion';

// Minimal luxury social icons
const icons: Record<string, ReactNode> = {
  Facebook: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  TikTok: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
  Telegram: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
};

export default function Footer() {
  return (
    <footer className="bg-noir border-t border-cream/5 pt-32 pb-8 px-8 lg:px-16">
      <div className="max-w-[1600px] mx-auto">
        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-32 pb-32 border-b border-cream/10"
        >
          <span className="text-xs tracking-[0.4em] uppercase text-champagne">The Journal</span>
          <h3 className="text-5xl md:text-6xl font-display text-cream mt-6 italic">
            Stay in the atelier's <span className="champagne-text">confidence.</span>
          </h3>
          <p className="text-muted mt-6 max-w-md mx-auto">
            Receive seasonal collection previews, private events, and craftsmanship notes.
          </p>
          <form className="mt-10 max-w-md mx-auto flex gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-transparent border-b border-cream/20 focus:border-champagne px-4 py-3 outline-none text-cream placeholder:text-muted transition-colors"
            />
            <button type="submit" className="champagne-btn">Subscribe</button>
          </form>
        </motion.div>

        {/* Main grid */}
        <div className="grid md:grid-cols-4 gap-12 mb-20">
          {/* ═══════════ BRAND + LOGO + SOCIALS ═══════════ */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-16 h-16 rounded-full overflow-hidden border border-champagne/40 shadow-[0_0_30px_rgba(201,169,97,0.25)]">
  <img
    src="/logo.png"
    alt="Wakanda Furniture"
    className="w-full h-full object-cover"
    style={{ transform: 'scale(1.1)', transformOrigin: '50% 39%' }}
  />
</span>
            </div>

            <p className="text-muted text-sm leading-relaxed max-w-sm">
              An Ethiopian atelier of handcrafted luxury furniture.
              Solid hardwood, Italian leather, and the patience of master craftsmen.
            </p>

            {/* Social icons — hairline squares */}
            <div className="flex gap-4 mt-10">
              {config.socials.map((s) => (
                <motion.a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-11 h-11 border border-cream/15 flex items-center justify-center text-cream/60 hover:text-noir hover:bg-champagne hover:border-champagne transition-all duration-500"
                >
                  {icons[s.name]}
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-champagne mb-6">Atelier</p>
            <p className="text-sm text-cream/70 leading-8">
              {config.contact.address}
              <br />
              {config.contact.hours}
              <br />
              By appointment on Sunday
            </p>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-champagne mb-6">Enquire</p>
            <p className="text-sm text-cream/70 leading-8">
              {config.contact.phone}
              <br />
              {config.contact.email}
              <br />
              <a href={config.contact.telegram} target="_blank" className="hover:text-champagne transition-colors">
                Telegram Concierge
              </a>
            </p>
          </div>
        </div>

        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9a961 50%, transparent)' }} />

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] tracking-[0.3em] uppercase text-muted">
          <p>© {new Date().getFullYear()} Wakanda Atelier</p>
          <p className="italic font-display normal-case text-xs tracking-normal">Crafted in Ethiopia. Made to last.</p>
        </div>
      </div>
      <QRCode botUsername="WakandaaFurniture_Bot" />
    </footer>
  );
}