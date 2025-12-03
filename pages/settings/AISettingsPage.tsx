import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { AlertCircle, Check } from 'lucide-react';

export default function AISettingsPage() {
  const [defaultModel, setDefaultModel] = useState('flux');
  const [resolution, setResolution] = useState('1:1');
  const [draftMode, setDraftMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Logic to save to local storage or user metadata would go here
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-surface border-white/5">
        <CardHeader>
          <CardTitle className="text-white">Preferências de IA</CardTitle>
          <CardDescription>
            Personalize como os modelos de geração se comportam por padrão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid gap-4 md:grid-cols-2">
             <div className="space-y-2">
                <Label htmlFor="model">Modelo Padrão</Label>
                <select 
                    id="model"
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="flux">FLUX.1 Pro (Recomendado)</option>
                    <option value="sdxl">Stable Diffusion XL</option>
                    <option value="kling">KLING Advanced (Video)</option>
                </select>
                <p className="text-[10px] text-slate-500">Este modelo será pré-selecionado na tela de criação.</p>
             </div>

             <div className="space-y-2">
                <Label htmlFor="resolution">Resolução Padrão</Label>
                <select 
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="1:1">1:1 (Quadrado - Instagram)</option>
                    <option value="9:16">9:16 (Vertical - Stories/Reels)</option>
                    <option value="16:9">16:9 (Horizontal - Youtube)</option>
                </select>
             </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-background/30 p-4">
             <div className="space-y-0.5">
                <Label className="text-base text-white">Modo Rascunho (Economia)</Label>
                <p className="text-sm text-slate-400">Gera imagens com menos passos para economizar tokens.</p>
             </div>
             <Switch checked={draftMode} onCheckedChange={setDraftMode} />
          </div>

        </CardContent>
        <CardFooter className="flex justify-between border-t border-white/5 pt-6">
            <p className="text-xs text-slate-500 flex items-center">
               <AlertCircle className="h-3 w-3 mr-1" />
               As alterações são aplicadas na próxima geração.
            </p>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white">
                {saved ? <><Check className="mr-2 h-4 w-4" /> Salvo</> : "Salvar Preferências"}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}