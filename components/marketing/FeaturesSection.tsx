import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Wand2, Layers, BarChart3, Lock, Zap, MousePointerClick } from 'lucide-react';
import { cn } from '../../lib/utils';

const features = [
  {
    icon: Wand2,
    title: "IA Generativa Avançada",
    description: "Nossos modelos criam imagens e vídeos únicos baseados na identidade visual da sua marca, sem parecer genérico."
  },
  {
    icon: Zap,
    title: "Velocidade Relâmpago",
    description: "Crie centenas de variações de anúncios em segundos. Teste diferentes ângulos e copys instantaneamente."
  },
  {
    icon: Layers,
    title: "Consistência de Marca",
    description: "Faça upload do seu brand kit (logo, cores, fontes) e garanta que todo criativo esteja 'on-brand'."
  },
  {
    icon: BarChart3,
    title: "Otimizado para Conversão",
    description: "Treinada com dados de top performers do Facebook e TikTok Ads para maximizar seu ROAS."
  },
  {
    icon: MousePointerClick,
    title: "Editor Drag & Drop",
    description: "Ajuste os detalhes finais com nosso editor intuitivo. Mova elementos, troque textos e refine o design."
  },
  {
    icon: Lock,
    title: "Segurança Empresarial",
    description: "Seus dados e assets são criptografados e nunca usados para treinar modelos públicos."
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-surface/30 border-y border-white/5 relative">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-semibold text-primary tracking-wide uppercase mb-3">Recursos Poderosos</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tudo o que você precisa para <br />
            <span className="text-slate-400">escalar seus criativos</span>
          </h3>
          <p className="text-slate-400 text-lg">
            Deixe a parte pesada com a Inteligência Artificial e foque na estratégia do seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-background/40 border-white/5 hover:border-primary/50 transition-all duration-300 hover:bg-background/60 group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl text-slate-100 group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;