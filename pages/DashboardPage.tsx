import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../components/providers/AuthProvider';
import { PlusCircle, History, Zap, ArrowRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase/client';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [balance, setBalance] = useState(0);
  const [genCount, setGenCount] = useState(0);
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topModel, setTopModel] = useState<string>("Nenhum");

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        setLoading(true);

        // 1. Fetch Credits (uses profile_id)
        const { data: creditData, error: creditError } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('profile_id', user.id) // Changed from user_id to profile_id
          .single();

        if (creditError && creditError.code !== 'PGRST116') { 
             console.warn("Credit fetch notice:", JSON.stringify(creditError));
        }
        
        setBalance(creditData?.balance || 0);

        // 2. Fetch Generation Count (uses profile_id)
        const { count, error: countError } = await supabase
          .from('generations')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', user.id);
        
        if (countError) {
             if (countError.code === '42P01') {
                 console.warn("Table 'generations' not found. Please run the SQL setup script.");
             } else {
                 console.warn("Count fetch warning:", JSON.stringify(countError));
             }
        }
        
        setGenCount(count || 0);

        // 3. Fetch Recent Generations (uses profile_id)
        const { data: recentData, error } = await supabase
          .from('generations')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) {
           const errMsg = error.message || JSON.stringify(error);
           if (error.code !== '42P01') { 
               console.error("Error fetching generations:", errMsg);
           }
           setRecentGenerations([]); 
        } else if (recentData && recentData.length > 0) {
            setRecentGenerations(recentData);

            const models = recentData.map((g: any) => g.model_id);
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

      } catch (error: any) {
        console.error("Error loading dashboard data:", error.message || error);
        setRecentGenerations([]); 
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

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