import React, { Suspense } from 'react';
import Header from '../components/shared/Header';
import HeroSection from '../components/marketing/Hero';
import { Button } from '../components/ui/Button';
import { Twitter, Linkedin, Instagram, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/shared/Logo';

// Code Splitting: Lazy load heavy sections to improve First Contentful Paint (FCP)
const FeaturesSection = React.lazy(() => import('../components/marketing/FeaturesSection'));
const PricingTable = React.lazy(() => import('../components/marketing/PricingTable'));

// Loading fallback component
const SectionLoader = () => (
  <div className="py-24 flex justify-center items-center bg-transparent">
    <Loader2 className="h-8 w-8 text-primary animate-spin" />
  </div>
);

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-50 font-sans selection:bg-primary selection:text-white">
      {/* Navigation */}
      <Header />

      <main className="flex-1">
        
        {/* Hero Section: Value Prop & CTA - Loaded Immediately */}
        <HeroSection />
        
        {/* Features Section: "Como Funciona" and Benefits - Lazy Loaded */}
        <Suspense fallback={<SectionLoader />}>
            <FeaturesSection />
        </Suspense>

        {/* Pricing Section: Tiers - Lazy Loaded */}
        <Suspense fallback={<SectionLoader />}>
            <PricingTable />
        </Suspense>

        {/* Pre-Footer CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10"></div>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Pronto para transformar seu marketing?
            </h2>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de profissionais que estão economizando tempo e dinheiro com o Criativo.io.
            </p>
            <Link to="/login">
                <Button size="lg" className="bg-white text-background hover:bg-slate-200 text-lg px-8 h-14 font-bold shadow-xl">
                Criar Conta Gratuitamente
                </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-white/5 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Brand Column */}
            <div className="space-y-4">
              <Link to="/" className="inline-block">
                <Logo />
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed">
                A plataforma líder em geração de criativos com IA para times de marketing de alta performance.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
                <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-white font-semibold mb-6">Produto</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-primary transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Showcase</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrações</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Empresa</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Criativo.io Tecnologia Ltda. Todos os direitos reservados.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}