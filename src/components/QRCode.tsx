'use client';
import { motion } from 'framer-motion';

export default function QRCode({ botUsername }: { botUsername: string }) {
  const deepLink = `https://t.me/${botUsername}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(deepLink)}&bgcolor=0f0e0c&color=c9a961`;

  return (
    <section className="py-32 px-8 lg:px-16 border-t border-cream/5">
      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-12 bg-champagne" />
            <span className="text-xs tracking-[0.4em] uppercase text-champagne">Scan & Chat</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-display text-cream leading-[0.95]">
            Meet our <span className="italic champagne-text">AI concierge.</span>
          </h2>
          <p className="text-muted mt-8 leading-relaxed max-w-md">
            Scan this QR code in our showroom — or anywhere you see our poster — to instantly
            open a conversation with our AI assistant. Available 24/7, in English and Amharic.
          </p>
          <a href={deepLink} target="_blank" className="champagne-btn mt-10 inline-block">
            Open @{botUsername}
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-br from-champagne/20 to-transparent blur-3xl" />
            <div className="relative bg-cream p-8 rounded-2xl shadow-2xl">
              <img src={qrUrl} alt="QR Code" className="w-72 h-72" />
              <div className="text-center mt-6">
                <p className="text-noir text-sm tracking-widest uppercase font-bold">@{botUsername}</p>
                <p className="text-noir/60 text-xs mt-1">Scan with your phone camera</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}