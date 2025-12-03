
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../components/providers/AuthProvider';
import { PlusCircle, History, Zap, ArrowRight, Image as ImageIcon, Sparkles, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase/client';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [balance, setBalance] = useState(0);
  const [genCount, setGenCount] = useState(0);
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topModel, setTopModel] = useState<string>("Nenhum");
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    // Strict guard: only run if we have a valid user ID
    if (!user?.id) return;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setNetworkError(false);

        // Define independent promises for concurrent execution
        
        // 1. Fetch Credits
        const creditsPromise = supabase
            .from('user_credits')
            .select('balance')
            .eq('profile_id', user!.id) 
            .single();

        // 2. Fetch Generation Count (Heavy query)
        const countPromise = supabase
            .from('generations')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', user!.id);

        // 3. Fetch Recent Generations
        const recentPromise = supabase
            .from('generations')
            .select('*')
            .eq('profile_id', user!.id)
            .order('created_at', { ascending: false })
            .limit(4);

        // Execute all promises in parallel using allSettled to prevent one failure from blocking others
        const [creditsResult, countResult, recentResult] = await Promise.allSettled([
            creditsPromise,
            countPromise,
            recentPromise
        ]);

        // --- Process Credits ---
        if (creditsResult.status === 'fulfilled') {
            const { data, error } = creditsResult.value;
            if (error && error.code !== 'PGRST116') {
                 if (error.message?.includes("Failed to fetch")) setNetworkError(true);
                 else console.warn("Credits error:", error.message);
            }
            setBalance(data?.balance || 0);
        }

        // --- Process Count ---
        if (countResult.status === 'fulfilled') {
            const { count, error } = countResult.value;
            if (error) {
                if (error.code !== '57014') console.warn("Count error:", error.message); // Ignore timeout warnings
                setGenCount(0);
            } else {
                setGenCount(count || 0);
            }
        }

        // --- Process Recent & Top Model ---
        if (recentResult.status === 'fulfilled') {
            const { data, error } = recentResult.value;
            if (error) {
                if (error.message?.includes("Failed to fetch")) setNetworkError(true);
                else console.warn("Recent fetch error:", error.message);
                setRecentGenerations([]);
            } else if (data && data.length > 0) {
                setRecentGenerations(data);
                // Local stats calc
                const models = data.map((g: any) => g.model_id || 'Unknown');
                const modelCounts = models.reduce((acc: any, model: string) => {
                    acc[model] = (acc[model] || 0) + 1;
                    return acc;
                }, {});
                const mostUsed = Object.keys(modelCounts).reduce((a, b) => modelCounts[a] > modelCounts[b] ? a : b);
                setTopModel(mostUsed.toUpperCase());
            } else {
                setRecentGenerations([]);
                setTopModel("Nenhum");
            }
        }

      } catch (error: any) {
        console.error("Dashboard critical error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user?.id]); // Only re-run if user ID changes

  return (
    <div className="min-h-screen bg-background text-slate-50 font-sans">
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Olá, {user?.user_metadata?.full_name || 'Criador'}</h1>
            <p className="text-slate-400">Bem-vindo ao seu painel de controle.</p>
          </div>
          <Link to="/create">
            <Button size="lg" className="bg-primary hover:bg-primary-dark gap-2 shadow-[0_0_15px_rgba(0,167,225,0.3)]">
              <PlusCircle className="h-5 w-5" />
              Novo Criativo
            </Button>
          </Link>
        </div>

        {/* Network Error Alert */}
        {networkError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-3">
                <WifiOff className="h-5 w-5" />
                <div>
                    <p className="font-bold">Você está offline ou a conexão falhou.</p>
                    <p className="text-xs opacity-80">Verifique sua internet. Os dados podem estar desatualizados.</p>
                </div>
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: Credits */}
          <Card className="bg-surface/50 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Créditos Disponíveis</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{balance.toLocaleString()}</div>
              <p className={`text-xs mt-1 ${balance === 0 ? 'text-red-400' : 'text-slate-500'}`}>
                {balance === 0 
                  ? "Sem plano ativo. Adicione créditos." 
                  : "Tokens válidos por tempo indeterminado"
                }
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Generations */}
          <Card className="bg-surface/50 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Criativos Gerados</CardTitle>
              <History className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{genCount}</div>
              <p className="text-xs text-slate-500 mt-1">Total acumulado</p>
            </CardContent>
          </Card>

          {/* Card 3: Top Model Used */}
          <Card className="bg-surface/50 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Modelo Principal</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{topModel}</div>
              <p className="text-xs text-slate-500 mt-1">Baseado nas criações recentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Creations Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Criações Recentes</h2>
            <Link to="/history">
              <Button variant="ghost" className="text-sm text-slate-400 hover:text-white">
                Ver todas <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
             <div className="text-center py-10 text-slate-500">Carregando...</div>
          ) : recentGenerations.length === 0 ? (
            /* Empty State */
            <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center">
               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface mb-4 border border-white/5">
                 <ImageIcon className="h-8 w-8 text-slate-500" />
               </div>
               <h3 className="text-lg font-medium text-white mb-2">Você ainda não criou nenhum criativo</h3>
               <p className="text-sm text-slate-400 mb-6">Comece agora a gerar imagens e vídeos com IA para suas campanhas.</p>
               <Link to="/create">
                 <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">Criar Primeiro</Button>
               </Link>
            </div>
          ) : (
            /* Recent Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentGenerations.map((gen) => (
                <div key={gen.id} className="group relative aspect-square rounded-lg bg-surface/30 border border-white/5 overflow-hidden hover:border-primary/50 transition-colors">
                    <img 
                      src={gen.result_url} 
                      alt="Generation" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-xs text-white line-clamp-2">{gen.prompt}</p>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
