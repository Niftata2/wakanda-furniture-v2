import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import FeaturedProducts from '@/components/FeaturedProducts';
import Craftsmanship from '@/components/Craftsmanship';
import Stats from '@/components/Stats';
import Categories from '@/components/Categories';
import Testimonials from '@/components/Testimonials';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';
import QRCode from '@/components/QRCode';

export default function Home() {
  return (
    <main className="min-h-screen bg-noir text-cream">
      <Navbar />
      <Hero />
      <Marquee />
      <FeaturedProducts />
      <Craftsmanship />
      <Stats />
      <Categories />
      <Testimonials />
      <ContactForm />
      <Footer />
    </main>
  );
}