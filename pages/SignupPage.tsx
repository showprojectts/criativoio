import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Logo from '../components/shared/Logo';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Supabase returns session null if email confirmation is required
      if (data.user && !data.session) {
         setSuccess(true);
      } else if (data.session) {
         // Auto login if email confirmation is disabled
         navigate('/dashboard'); 
      }

    } catch (err: any) {
      let msg = err.message || 'Ocorreu um erro ao criar a conta.';
      
      if (msg.includes('User already registered')) {
        msg = 'Este e-mail já está cadastrado. Por favor, faça o login.';
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border bg-surface/80 border-primary/20 shadow-2xl">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-2 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Verifique seu e-mail</h2>
            <div className="bg-surface/50 p-4 rounded-lg border border-white/5 w-full">
                <p className="text-slate-300">
                Enviamos um link de confirmação para: <br/>
                <strong className="text-primary">{email}</strong>
                </p>
            </div>
            <p className="text-sm text-slate-500">
              Clique no link enviado para ativar sua conta e acessar o painel.
              Verifique também sua caixa de Spam.
            </p>
            <Button className="mt-4 w-full bg-surface hover:bg-white/5 border border-white/10" variant="outline" onClick={() => navigate('/login')}>
              Voltar para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors z-20"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o Início
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
           <Link to="/" className="flex items-center justify-center">
             <Logo size="large" />
          </Link>
        </div>

        <Card className="border-border bg-surface/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Crie sua conta</CardTitle>
            <CardDescription className="text-center text-slate-400">
              Comece a gerar criativos com IA em segundos
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="grid gap-4">
               <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                  className="bg-background/50 border-white/10 text-white focus:border-primary/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="bg-background/50 border-white/10 text-white focus:border-primary/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required 
                  className="bg-background/50 border-white/10 text-white focus:border-primary/50"
                />
                <p className="text-xs text-slate-500">Mínimo de 6 caracteres</p>
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary-dark mt-2 font-semibold shadow-lg shadow-primary/20" isLoading={loading}>
                Criar Conta
              </Button>
            </form>

          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-slate-400 w-full">
              Já tem uma conta?{" "}
              <Link to="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                Faça Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}