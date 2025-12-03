import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { 
  LayoutDashboard, 
  Users, 
  Coins, 
  Settings, 
  TrendingUp, 
  CreditCard, 
  Zap, 
  Crown,
  Activity,
  Database
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // 1. Authorization Check (Simulating Server Component logic on Client)
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return;

      // If no session, redirect to login
      if (!session) {
        navigate('/login');
        return;
      }

      try {
        // Query profile for admin flag
        // Note: Ensure your Supabase 'profiles' table has an 'is_admin' boolean column
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (error || !profile || !profile.is_admin) {
          console.warn("Access Denied: User is not an admin.");
          navigate('/dashboard'); // Redirect standard users
        } else {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Admin check failed:", err);
        navigate('/dashboard');
      } finally {
        setCheckingRole(false);
      }
    };

    checkAdminStatus();
  }, [session, authLoading, navigate]);

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="text-primary h-8 w-8" />
        <span className="ml-3 text-slate-400">Verificando permissões...</span>
      </div>
    );
  }

  // If we passed the checks but for some react-cycle reason isAdmin is false, don't render
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-slate-50 font-sans">
      
      <div className="container mx-auto px-4 py-8">
        {/* Layout: 3 Columns for Large Screens */}
        <div className="flex flex-col lg:grid lg:grid-cols-10 gap-6">
          
          {/* 1. Sidebar Navigation (20% -> 2 cols) */}
          <aside className="lg:col-span-2 space-y-2">
            <div className="bg-surface/50 border border-white/5 rounded-xl p-4 sticky top-24">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Admin Panel</h2>
              <nav className="space-y-1">
                <Button variant="ghost" className="w-full justify-start text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Visão Geral
                </Button>
                <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
                  <Users className="mr-2 h-4 w-4" />
                  Gerenciar Usuários
                </Button>
                <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
                  <Coins className="mr-2 h-4 w-4" />
                  Gerenciar Créditos
                </Button>
                <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Button>
              </nav>
            </div>
          </aside>

          {/* 2. Main Content Area (70% -> 7 cols) */}
          <main className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Administrativo</h1>
              <p className="text-slate-400">Visão geral da performance do SaaS.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* MRR Card */}
              <Card className="bg-surface/50 border-white/5 hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Receita Mensal (MRR)</CardTitle>
                  <CreditCard className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">R$ 5.430,00</div>
                  <p className="text-xs text-green-400 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" /> +15% vs mês anterior
                  </p>
                </CardContent>
              </Card>

              {/* New Users Card */}
              <Card className="bg-surface/50 border-white/5 hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Novos Usuários (30d)</CardTitle>
                  <Users className="h-4 w-4 text-cyan-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">48</div>
                  <p className="text-xs text-slate-500 mt-1">Total: 1,240 usuários</p>
                </CardContent>
              </Card>

              {/* Tokens Generated */}
              <Card className="bg-surface/50 border-white/5 hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Tokens Gerados</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">1.2M</div>
                  <p className="text-xs text-slate-500 mt-1">Custo infra: R$ 420,00</p>
                </CardContent>
              </Card>

               {/* Best Seller Plan */}
               <Card className="bg-surface/50 border-white/5 hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Plano Mais Vendido</CardTitle>
                  <Crown className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">Pro</div>
                  <p className="text-xs text-slate-500 mt-1">65% das assinaturas</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Placeholder */}
            <Card className="bg-surface/30 border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Atividade Recente do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                            <Users className="h-4 w-4" />
                         </div>
                         <div>
                            <p className="text-white">Novo usuário registrado</p>
                            <p className="text-xs text-slate-500">user_{i}@email.com</p>
                         </div>
                      </div>
                      <span className="text-slate-500 text-xs">{i * 15} min atrás</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>

          {/* 3. Status Card (10% -> 1 col, expanded for usability on mobile) */}
          <aside className="lg:col-span-1">
             <div className="sticky top-24 space-y-4">
                <Card className="bg-surface border-white/5 flex flex-col items-center p-4 text-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mb-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <p className="text-xs font-bold text-white">SYSTEM</p>
                    <p className="text-[10px] text-green-400">ONLINE</p>
                </Card>

                <Card className="bg-surface border-white/5 flex flex-col items-center p-4 text-center">
                    <Database className="h-4 w-4 text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-white">DB</p>
                    <p className="text-[10px] text-slate-400">HEALTHY</p>
                </Card>

                <Card className="bg-surface border-white/5 flex flex-col items-center p-4 text-center">
                    <Activity className="h-4 w-4 text-primary mb-2" />
                    <p className="text-xs font-bold text-white">LOAD</p>
                    <p className="text-[10px] text-slate-400">24%</p>
                </Card>
             </div>
          </aside>

        </div>
      </div>
    </div>
  );
}