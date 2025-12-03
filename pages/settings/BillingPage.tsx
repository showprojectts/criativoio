import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../components/providers/AuthProvider';
import { Zap, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';

export default function BillingPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCredits() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('profile_id', user.id) // Changed from user_id to profile_id
          .single();

        if (error) {
            if (error.code !== 'PGRST116') { // Ignore "no rows found" error for new users
                 console.error("Error fetching credits:", JSON.stringify(error));
            }
            setBalance(0);
        } else if (data) {
          setBalance(data.balance);
        } else {
            setBalance(0);
        }
      } catch (err: any) {
        console.error("Error fetching credits (catch):", err.message || JSON.stringify(err));
        setBalance(0);
      } finally {
        setLoading(false);
      }
    }
    fetchCredits();
  }, [user]);

  const handlePortalRedirect = (e: React.MouseEvent) => {
      e.preventDefault();
      setToast("Redirecionando para o Portal de Faturas do Stripe...");
      setTimeout(() => setToast(null), 3000);
  }

  if (loading) {
     return <div className="p-10 flex justify-center"><Spinner className="h-6 w-6 text-primary"/></div>;
  }

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
                        <h3 className="text-xl font-bold text-white">Conta Gratuita</h3>
                        <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">Ativo</Badge>
                    </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-slate-300" />
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Renova em:</span> <span className="text-white">N/A (Pré-pago)</span>
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
                <div className="bg-primary h-full rounded-full w-full opacity-50"></div>
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
            <Link to="/pricing" className="w-full sm:w-auto">
                <Button className="w-full bg-primary hover:bg-primary-dark font-semibold">
                    Gerenciar Assinatura
                </Button>
            </Link>
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
