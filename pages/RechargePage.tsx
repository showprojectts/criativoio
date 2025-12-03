import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Check, Zap, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';

const packages = [
  {
    id: 'pkg_small',
    name: 'Pack Pequeno',
    tokens: 500,
    price: 30,
    features: ['R$ 0,06 por token', 'Ideal para testes', 'Validade: Indeterminada'],
    popular: false
  },
  {
    id: 'pkg_medium',
    name: 'Pack Médio',
    tokens: 1500,
    price: 75,
    features: ['R$ 0,05 por token', 'Melhor Custo-Benefício', 'Recomendado para Creators'],
    popular: true
  },
  {
    id: 'pkg_large',
    name: 'Pack Grande',
    tokens: 4000,
    price: 180,
    features: ['R$ 0,045 por token', 'Volume máximo', 'Para Agências'],
    popular: false
  }
];

export default function RechargePage() {
  const { user } = useAuth();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePurchase = async (pkg: typeof packages[0]) => {
    if (!user) return;
    
    setProcessingId(pkg.id);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Simula um delay de gateway de pagamento (Stripe/MercadoPago)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Chama a API Serverless para processar a recarga (Simulando confirmação de webhook)
      const response = await fetch('/api/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Opcional: Em um cenário real, enviaríamos o token JWT aqui também para validação extra
        },
        body: JSON.stringify({
          user_id: user.id,
          tokens_to_add: pkg.tokens
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao processar a recarga.');
      }
      
      setSuccessMsg(`Pagamento confirmado! ${pkg.tokens} tokens foram adicionados à sua conta.`);
      
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Ocorreu um erro ao processar o pagamento. Tente novamente.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-50 font-sans">
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Comprar Mais Créditos</h1>
          <p className="text-slate-400 text-lg">
            Tokens que nunca expiram. Recarregue seu saldo e continue criando.
          </p>
        </div>

        {/* Feedback Messages */}
        <div className="max-w-3xl mx-auto mb-8">
          {successMsg && (
            <Alert className="bg-green-500/10 border-green-500/30 text-green-400 animate-in fade-in slide-in-from-top-2">
              <Check className="h-4 w-4" />
              <AlertTitle>Compra Realizada!</AlertTitle>
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
          )}
          {errorMsg && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro no Pagamento</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={cn(
                "relative flex flex-col transition-all duration-300 h-full",
                pkg.popular 
                  ? "bg-surface border-primary shadow-[0_0_30px_rgba(0,167,225,0.15)] scale-105 z-10 ring-1 ring-primary/30" 
                  : "bg-surface/50 border-white/5 hover:border-primary/30 hover:bg-surface/80"
              )}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary hover:bg-primary text-white px-4 py-1 shadow-lg shadow-primary/25">
                    Melhor Valor
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-slate-200">{pkg.name}</CardTitle>
                <div className="mt-4 flex items-baseline text-white">
                    <span className="text-sm text-slate-400 mr-1">R$</span>
                    <span className="text-4xl font-bold tracking-tight">{pkg.price}</span>
                    <span className="text-sm text-slate-400 ml-1">,00</span>
                </div>
                <CardDescription className="text-primary font-medium flex items-center gap-1 bg-primary/10 w-fit px-2 py-1 rounded-md mt-2">
                  <Zap className="h-3 w-3" /> {pkg.tokens.toLocaleString()} Tokens
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="h-px bg-white/5 mb-4"></div>
                <ul className="space-y-3">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className={cn("h-1.5 w-1.5 rounded-full", pkg.popular ? "bg-primary" : "bg-slate-600")} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button 
                  onClick={() => handlePurchase(pkg)}
                  disabled={!!processingId}
                  className={cn(
                    "w-full font-semibold h-12 text-base transition-all",
                    pkg.popular 
                      ? "bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-primary/40" 
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  )}
                >
                  {processingId === pkg.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Comprar Agora"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-16 max-w-3xl mx-auto text-center border-t border-white/5 pt-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Compra Segura & Instantânea</span>
            </div>
            <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
              O pagamento será processado via nosso gateway seguro. Após a confirmação, os créditos serão adicionados instantaneamente à sua conta. Pagamento único, sem mensalidades.
            </p>
            
            <div className="flex gap-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-300 pt-2">
               {/* Payment Icons Simulation */}
               <div className="h-6 w-10 bg-white/20 rounded-sm flex items-center justify-center text-[8px] font-bold text-black bg-white">VISA</div>
               <div className="h-6 w-10 bg-white/20 rounded-sm flex items-center justify-center text-[8px] font-bold text-white bg-red-500">MC</div>
               <div className="h-6 w-10 bg-white/20 rounded-sm flex items-center justify-center text-[8px] font-bold text-white bg-green-600">PIX</div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}