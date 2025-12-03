
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../components/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { Check, Zap, Shield, AlertCircle, CheckCircle2, Box, Rocket, Crown, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  color: string;
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    id: 'free',
    name: "Free",
    price: "R$ 0/mês",
    description: "Para explorar a plataforma.",
    features: ["Acesso Limitado", "Geração Nano", "Sem uso comercial"],
    icon: Box,
    color: "text-slate-400",
    popular: false
  },
  {
    id: 'starter',
    name: "Starter",
    price: "R$ 97/mês",
    description: "Para criadores iniciantes.",
    features: ["500 Créditos Mensais", "Geração de Imagens", "Licença Comercial", "Suporte por Email"],
    icon: Rocket,
    color: "text-blue-400",
    popular: false
  },
  {
    id: 'pro',
    name: "Pro",
    price: "R$ 197/mês",
    description: "Para profissionais de marketing.",
    features: ["1.500 Créditos Mensais", "Acesso ao Modelo Banana", "Editor Mágico", "Suporte Prioritário", "Sem Marca D'água"],
    icon: Star,
    color: "text-primary",
    popular: true
  },
  {
    id: 'agency',
    name: "Agency",
    price: "R$ 497/mês",
    description: "Potência máxima para times.",
    features: ["4.000 Créditos Mensais", "Acesso ao Modelo Flow (4K)", "API Access", "Gerente Dedicado", "Múltiplos Usuários"],
    icon: Crown,
    color: "text-purple-400",
    popular: false
  }
];

export default function PlansPage() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const [loading, setLoading] = useState(true);
  
  // Feedback States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', user.id)
          .single();
        
        if (data) {
            setCurrentPlan(data.plan_id || 'FREE');
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, [user]);

  const handleUpgrade = (planName: string) => {
      setErrorMsg(null);
      setSuccessMsg(null);
      setInfoMsg(`Simulando redirecionamento para checkout do plano ${planName}...`);
      setTimeout(() => setInfoMsg(null), 3000);
  };

  const handleBuyCredits = (pkgAmount: number) => {
      setErrorMsg(null);
      setSuccessMsg(null);
      setInfoMsg(null);

      if (currentPlan.toUpperCase() === 'FREE') {
          // RESTRICTION FOR FREE USERS
          setErrorMsg('Ação Bloqueada: Você está no Plano Gratuito. Para comprar créditos adicionais, é necessário fazer um Upgrade para um Plano Pago.');
      } else {
          // SUCCESS FOR PAID USERS (Simulation)
          setSuccessMsg(`Solicitação para ${pkgAmount} créditos recebida! Redirecionando para pagamento...`);
          setTimeout(() => setSuccessMsg(null), 4000);
      }
  };

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Carregando planos...</div>;

  return (
    <div className="space-y-12 pb-20">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Escale sua produção criativa
        </h1>
        <p className="text-slate-400 text-lg">
          Escolha o plano que melhor se adapta ao seu volume de trabalho. 
          Faça upgrade ou cancele a qualquer momento.
        </p>
      </div>

      {/* Feedback Alerts (Sticky top if needed, currently inline) */}
      <div className="max-w-4xl mx-auto space-y-4 px-4">
          {errorMsg && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acesso Restrito</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
          {successMsg && (
            <Alert className="bg-green-500/10 border-green-500/30 text-green-400 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Sucesso</AlertTitle>
                <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
          )}
          {infoMsg && (
            <Alert className="bg-primary/10 border-primary/30 text-primary animate-in fade-in slide-in-from-top-2">
                <Zap className="h-4 w-4" />
                <AlertTitle>Processando</AlertTitle>
                <AlertDescription>{infoMsg}</AlertDescription>
            </Alert>
          )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 max-w-[1400px] mx-auto">
        {tiers.map((tier) => {
            const isCurrent = currentPlan.toUpperCase() === tier.id.toUpperCase();
            const Icon = tier.icon;
            
            return (
                <Card 
                    key={tier.id} 
                    className={cn(
                        "relative flex flex-col transition-all duration-300 h-full border",
                        isCurrent 
                            ? "bg-primary/5 border-primary ring-1 ring-primary/50 shadow-[0_0_20px_rgba(0,167,225,0.1)] scale-[1.02] z-10" 
                            : "bg-surface border-white/5 hover:border-white/20 hover:bg-surface/80 hover:-translate-y-1"
                    )}
                >
                    {isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-primary text-white border-none px-3 py-0.5 shadow-lg">
                                Seu Plano Atual
                            </Badge>
                        </div>
                    )}
                    {tier.popular && !isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                                Mais Popular
                            </Badge>
                        </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                        <div className={cn("mx-auto p-3 rounded-full mb-3 w-fit bg-surface border border-white/10", tier.color)}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-bold text-white">{tier.name}</CardTitle>
                        <CardDescription className="text-sm text-slate-400 min-h-[40px]">{tier.description}</CardDescription>
                        <div className="pt-4 pb-2">
                            <span className="text-3xl font-bold text-white">{tier.price}</span>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1">
                        <div className="h-px bg-white/5 w-full mb-6"></div>
                        <ul className="space-y-3">
                            {tier.features.map((feat, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                    <span className="leading-tight">{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    
                    <CardFooter className="pt-4">
                        <Button 
                            className={cn(
                                "w-full font-semibold h-11", 
                                isCurrent 
                                    ? "bg-white/5 text-slate-400 border border-white/10 cursor-not-allowed hover:bg-white/5" 
                                    : "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20"
                            )}
                            onClick={() => !isCurrent && handleUpgrade(tier.name)}
                            disabled={isCurrent}
                        >
                            {isCurrent ? "Plano Atual" : "Fazer Upgrade"}
                        </Button>
                    </CardFooter>
                </Card>
            )
        })}
      </div>

      {/* Credit Purchase Section */}
      <div className="max-w-4xl mx-auto px-4 mt-20">
          <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <Zap className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-white">Pacotes de Créditos Avulsos</h3>
                  <p className="text-slate-400 text-sm">Precisa de mais potência este mês? Adicione créditos sem mudar de plano.</p>
              </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                  { amount: 500, price: 'R$ 30', label: 'Pack Básico' },
                  { amount: 1500, price: 'R$ 75', label: 'Melhor Valor', popular: true },
                  { amount: 4000, price: 'R$ 180', label: 'Pack Pro' }
              ].map((pkg, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                        "group border rounded-xl p-5 flex flex-col gap-3 cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden", 
                        pkg.popular ? "border-primary/30 bg-primary/5" : "border-white/10 bg-surface/30"
                    )}
                    onClick={() => handleBuyCredits(pkg.amount)}
                  >
                      {pkg.popular && (
                          <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                              POPULAR
                          </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-400">{pkg.label}</span>
                      </div>
                      
                      <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white">{pkg.amount}</span>
                          <span className="text-sm text-yellow-500 font-medium">Tokens</span>
                      </div>
                      
                      <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center group-hover:border-white/10 transition-colors">
                          <span className="text-lg font-semibold text-slate-200">{pkg.price}</span>
                          <Button size="sm" variant="ghost" className="h-8 text-xs hover:bg-white/10 text-primary">
                              Comprar
                          </Button>
                      </div>
                  </div>
              ))}
          </div>
          
          <div className="mt-6 flex items-start gap-2 bg-surface/50 p-4 rounded-lg border border-white/5 text-xs text-slate-500">
             <Shield className="h-4 w-4 shrink-0 text-slate-400" />
             <p>
                Créditos avulsos não expiram enquanto sua conta estiver ativa. 
                A compra de créditos avulsos está disponível apenas para assinantes de planos pagos (Starter, Pro, Agency).
             </p>
          </div>
      </div>

    </div>
  );
}
