import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../components/providers/AuthProvider';
import Logo from '../components/shared/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  React.useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Check session immediately
      const { data: { session: newSession } } = await supabase.auth.getSession();
      
      if (newSession) {
          setTimeout(() => {
            navigate('/dashboard');
          }, 500); 
      }

    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';

      if (msg.includes('Invalid login credentials') || msg.includes('invalid claim')) {
         setError('Credenciais inválidas. Verifique seu e-mail e senha e tente novamente.');
      } else if (msg.includes('User is banned')) {
         setError('Sua conta foi suspensa permanentemente. Entre em contato com o suporte se acreditar que isso é um erro.');
      } else {
         setError(msg || 'Ocorreu um erro ao tentar entrar.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors z-20"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o Início
      </Link>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="flex justify-center mb-8">
           <Link to="/" className="flex items-center justify-center">
             <Logo size="large" />
          </Link>
        </div>

        <Card className="border-border bg-surface/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-center text-slate-400">
              Entre com seu e-mail e senha para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertTitle>Não foi possível entrar</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="bg-background/50 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link to="#" className="text-xs text-primary hover:text-primary-dark">Esqueceu?</Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="bg-background/50 border-white/10 text-white focus:border-primary/50"
                />
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary-dark mt-2 font-semibold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                    </>
                ) : (
                    "Entrar"
                )}
              </Button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-slate-500">Ou continue com</span>
              </div>
            </div>

            <Button variant="outline" type="button" disabled className="w-full border-white/10 hover:bg-white/5 text-slate-300">
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
              Google (Em breve)
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-slate-400 w-full">
              Não tem uma conta?{" "}
              <Link to="/signup" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}