import React, { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../components/providers/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';

export default function SecurityPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReset = async () => {
    if (!user || !user.email) return;
    
    setLoading(true);
    setError(null);
    setSent(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/#/settings/profile`, // Or a specific reset password page
      });

      if (error) throw error;

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-surface border-white/5">
        <CardHeader>
          <CardTitle className="text-white">Segurança da Conta</CardTitle>
          <CardDescription>
            Gerencie sua senha e métodos de autenticação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex items-center justify-between border border-white/10 rounded-lg p-4 bg-background/30">
            <div>
               <h3 className="font-medium text-white">Senha</h3>
               <p className="text-sm text-slate-400">Recomendamos alterar sua senha periodicamente.</p>
            </div>
            
            {!sent ? (
                <Button variant="outline" onClick={handlePasswordReset} disabled={loading} className="border-white/10 text-slate-300 hover:text-white">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar e-mail de redefinição
                </Button>
            ) : (
                <Button variant="ghost" disabled className="text-green-500 hover:text-green-500 hover:bg-transparent cursor-default">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> E-mail enviado
                </Button>
            )}
          </div>

          {sent && (
            <Alert className="bg-green-500/10 border-green-500/30 text-green-400">
               <Mail className="h-4 w-4" />
               <AlertTitle>Verifique seu e-mail</AlertTitle>
               <AlertDescription>
                 Enviamos um link para <strong>{user?.email}</strong> para que você possa criar uma nova senha.
               </AlertDescription>
            </Alert>
          )}

          {error && (
             <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}

        </CardContent>
      </Card>
      
      {/* Placeholder for future 2FA */}
      <Card className="bg-surface border-white/5 opacity-50">
        <CardHeader>
          <div className="flex justify-between items-center">
             <CardTitle className="text-white">Autenticação de Dois Fatores (2FA)</CardTitle>
             <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Em Breve</span>
          </div>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button disabled variant="secondary" className="w-full sm:w-auto">Configurar 2FA</Button>
        </CardContent>
      </Card>

    </div>
  );
}