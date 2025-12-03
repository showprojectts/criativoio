import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Check, Zap, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PricingTier {
  name: string;
  price: string;
  credits: number;
  description: string;
  features: string[];
  recommended?: boolean;
  buttonText: string;
}

const tiers: PricingTier[] = [
  {
    name: "Starter",
    price: "R$ 97",
    credits: 500,
    description: "Para quem está começando a escalar seus anúncios.",
    features: [
      "500 Créditos de IA / mês",
      "Geração de Imagens (1080p)",
      "Formatos: Feed e Stories",
      "Licença de Uso Comercial",
      "Suporte via E-mail"
    ],
    buttonText: "Começar Starter",
    recommended: false
  },
  {
    name: "Pro",
    price: "R$ 197",
    credits: 1500,
    description: "O plano ideal para criadores e gestores de tráfego.",
    features: [
      "1.500 Créditos de IA / mês",
      "Geração de Imagens & Vídeos",
      "Editor Mágico (Inpaint/Outpaint)",
      "Remoção de Fundo Automática",
      "Sem Marca D'água",
      "Suporte Prioritário"
    ],
    buttonText: "Assinar Pro",
    recommended: true
  },
  {
    name: "Agency",
    price: "R$ 497",
    credits: 4000,
    description: "Potência máxima para agências e times.",
    features: [
      "4.000 Créditos de IA / mês",
      "Vídeos em 4K Ultra HD",
      "Múltiplos Workspaces",
      "API de Acesso",
      "Gerente de Conta Dedicado",
      "Early Access a Novas Features"
    ],
    buttonText: "Falar com Vendas",
    recommended: false
  }
];

const PricingTable: React.FC = () => {
  return (
    <section id="pricing" className="py-24 relative bg-background overflow-hidden">
        {/* Background Gradients for ambience */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6">
        
        <div className="text-center mb-16 max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Escolha o plano perfeito para <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-300">sua escala</span>
          </h2>
          <p className="text-slate-400 text-lg md:text-xl">
            Tenha acesso a nossa IA generativa e crie ativos de marketing que convertem.
            Cancele ou faça upgrade a qualquer momento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">
          {tiers.map((tier, index) => (
            <Card 
              key={index} 
              className={cn(
                "relative flex flex-col transition-all duration-300 bg-surface/50 backdrop-blur-sm border-border hover:border-primary/50",
                tier.recommended 
                  ? "border-primary shadow-[0_0_40px_rgba(0,167,225,0.15)] bg-surface scale-105 z-10 ring-1 ring-primary/20" 
                  : "shadow-lg hover:shadow-xl hover:shadow-primary/5 mt-0 md:mt-8"
              )}
            >
              {tier.recommended && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                  <Badge className="bg-gradient-to-r from-primary to-cyan-500 text-white border-none px-6 py-1.5 text-sm font-bold shadow-lg shadow-primary/25">
                    Mais Vendido 🔥
                  </Badge>
                </div>
              )}

              <CardHeader className={cn("pb-8", tier.recommended && "pt-10")}>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl text-slate-200 font-medium">{tier.name}</CardTitle>
                        <div className="mt-4 flex items-baseline text-white">
                        <span className="text-4xl md:text-5xl font-bold tracking-tight">{tier.price}</span>
                        <span className="ml-2 text-lg font-medium text-slate-500">/mês</span>
                        </div>
                    </div>
                    {tier.recommended && <Sparkles className="text-primary h-6 w-6" />}
                </div>
                <CardDescription className="mt-4 text-slate-400 text-base">
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-6 p-4 rounded-lg bg-background/50 border border-white/5">
                    <p className="text-sm text-slate-400 mb-1">Limite mensal</p>
                    <p className="text-xl font-bold text-primary flex items-center gap-2">
                        {tier.credits.toLocaleString()} <span className="text-white text-sm font-normal">créditos</span>
                    </p>
                </div>

                <div className="space-y-4">
                  {tier.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3 group">
                      <div className={cn(
                          "mt-0.5 rounded-full p-0.5 shrink-0 transition-colors",
                          tier.recommended ? "bg-primary text-white" : "bg-slate-800 text-slate-400 group-hover:text-primary group-hover:bg-primary/20"
                      )}>
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-6 pb-8">
                <Button 
                  className={cn(
                      "w-full text-base font-semibold h-12 transition-all",
                      tier.recommended 
                        ? "bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 hover:shadow-primary/40" 
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
                  )}
                  variant={tier.recommended ? "default" : "outline"}
                >
                  {tier.buttonText}
                  {tier.recommended && <Zap className="ml-2 h-4 w-4 fill-current" />}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-20 border-t border-white/5 pt-10 text-center">
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-slate-400">
                <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>Pagamento Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>Cancele quando quiser</span>
                </div>
                <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>Nota Fiscal Automática</span>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
};

export default PricingTable;