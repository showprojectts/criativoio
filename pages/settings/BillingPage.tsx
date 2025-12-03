
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../components/providers/AuthProvider';
import { Zap, CreditCard, ExternalLink, Loader2, AlertCircle, Calendar, ArrowUpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';

export default function BillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [planId, setPlanId] = useState<string>('FREE');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  
  // New States for UX
  const [renewalDate, setRenewalDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        
        // 1. Fetch Credits
        const creditsPromise = supabase
          .from('user_credits')
          .select('balance')
          .eq('profile_id', user.id)
          .single();

        // 2. Fetch Plan ID form Profile
        const profilePromise = supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', user.id)
          .single();

        const [creditsResult, profileResult] = await Promise.allSettled([creditsPromise, profilePromise]);

        // Process Credits
        if (creditsResult.status === 'fulfilled') {
            const { data, error } = creditsResult.value;
            if (data) {
                setBalance(data.balance);
            } else {
                setBalance(0);
            }
        }

        // Process Plan & Renewal Date
        if (profileResult.status === 'fulfilled') {
            const { data, error } = profileResult.value;
            if (data && data.plan_id) {
                const pid = data.plan_id.toUpperCase();
                setPlanId(pid);
                // Simulate Renewal Date for Paid Plans (Starter, Pro, Agency)
                if (pid !== 'FREE') {
                    setRenewalDate('15/07/2025');
                } else {
                    setRenewalDate(null);
                }
            } else {
                setPlanId('FREE');
                setRenewalDate(null);
            }
        }

      } catch (err: any) {
        console.error("Error fetching billing data:", err.message || JSON.stringify(err));
        setBalance(0);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handlePortalRedirect = (e: React.MouseEvent) => {
      e.preventDefault();
      setToast("Redirecionando para o Portal de Faturas do Stripe...");
      setTimeout(() => setToast(null), 3000);
  }

  if (loading) {
     return <div className="p-10 flex justify-center"><Spinner className="h-6 w-6 text-primary"/></div>;
  }

  // Helper formatting
  const isPaidPlan = planId !== 'FREE';
  const planDisplayName = planId === 'FREE' ? 'Plano Gratuito' : `Plano ${planId.charAt(0).toUpperCase() + planId.slice(1).toLowerCase()}`;

  return (
    <div className="space-y-6">
      <Card className="bg-surface border-white/5">
        <CardHeader>
          <CardTitle className="text-white">Plano e Faturamento</CardTitle>
          <CardDescription>
            Gerencie sua assinatura e saldo de créditos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Current Plan Card */}
          <div className="rounded-lg border border-white/10 bg-background/50 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">Plano Atual</p>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{planDisplayName}</h3>
                        <Badge variant="outline" className={isPaidPlan ? "border-primary/50 text-primary bg-primary/10" : "border-slate-500/50 text-slate-400 bg-slate-500/10"}>
                            {isPaidPlan ? 'Ativo' : 'Básico'}
                        </Badge>
                    </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-slate-300" />
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                    <div className={`h-2 w-2 rounded-full ${isPaidPlan ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                    {isPaidPlan ? `Status: ${planDisplayName} Pré-pago Ativo` : 'Status: Plano Gratuito'}
                </div>
                
                {isPaidPlan && renewalDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 ml-4">
                        <Calendar className="h-3 w-3" />
                        Próxima Renovação: <span className="text-white font-medium">{renewalDate}</span>
                    </div>
                )}
            </div>
          </div>

          {/* Credits Balance */}
          <div className="rounded-lg border border-white/10 bg-background/50 p-6">
             <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-400">Créditos Restantes</p>
                <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{balance?.toLocaleString()}</span>
                <span className="text-sm text-slate-500">tokens</span>
             </div>
             <div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                    className={isPaidPlan ? "bg-primary h-full rounded-full opacity-80" : "bg-slate-600 h-full rounded-full opacity-50"} 
                    style={{ width: isPaidPlan ? '100%' : '10%' }}
                ></div>
             </div>
          </div>

          {toast && (
             <div className="fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-5 flex items-center gap-2 z-50">
                 <Loader2 className="h-4 w-4 animate-spin" />
                 {toast}
             </div>
          )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 border-t border-white/5 pt-6">
            <Button 
                onClick={() => navigate('/plans')}
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark font-semibold"
            >
                Gerenciar Planos e Comprar Créditos
            </Button>
            
             <a href="#" onClick={handlePortalRedirect} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                    Histórico de Faturas <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
            </a>
        </CardFooter>
      </Card>
    </div>
  );
}