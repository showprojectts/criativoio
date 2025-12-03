import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';
import { Label } from '../../components/ui/Label';

export default function NotificationsPage() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [lowCredits, setLowCredits] = useState(true);

  return (
    <div className="space-y-6">
      <Card className="bg-surface border-white/5">
        <CardHeader>
          <CardTitle className="text-white">Notificações</CardTitle>
          <CardDescription>
            Escolha como você quer ser notificado sobre atividades na sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
                <Label className="text-white font-medium">Notificações por E-mail</Label>
                <span className="text-sm text-slate-400">Receba novidades, dicas e atualizações de produtos.</span>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>

          <div className="h-px bg-white/5 w-full"></div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
                <Label className="text-white font-medium">Alerta de Saldo Baixo</Label>
                <span className="text-sm text-slate-400">Seja avisado quando seus créditos estiverem acabando.</span>
            </div>
            <Switch checked={lowCredits} onCheckedChange={setLowCredits} />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}