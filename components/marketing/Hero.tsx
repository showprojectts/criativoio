import React from 'react';
import { Button } from '../ui/Button';
import { Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Nova Versão: Editor de Vídeo com IA
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Crie Criativos de Marketing <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-200">
               em Segundos, não Horas
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            O Criativo.io usa inteligência artificial avançada para gerar imagens e vídeos de alta conversão para suas campanhas de Facebook, Instagram e TikTok.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 bg-primary hover:bg-primary-dark shadow-[0_0_20px_rgba(0,167,225,0.4)] text-lg h-14 px-8 font-bold">
                <Wand2 className="h-5 w-5" />
                Testar Agora
                </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;