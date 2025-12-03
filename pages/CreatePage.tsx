
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
import { 
  Image as ImageIcon, 
  Wand2, 
  Sparkles, 
  AlertCircle, 
  Download, 
  Loader2, 
  Palette, 
  Lightbulb,
  Lock,
  Layers,
  Rocket,
  RefreshCw,
  Video,
  FileCode,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../components/providers/AuthProvider';
import { useLocation } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

// Definição de Tipos
type PlanType = 'FREE' | 'BASIC' | 'PRO' | 'AGENCY';
type GenMode = 'nano' | 'banana' | 'flow';
type MediaType = 'image' | 'video';

// 1. Mapa de Custos (Regra de Negócio)
const COST_MAP: Record<GenMode, number> = {
  nano: 1,
  banana: 3,
  flow: 5
};

export default function CreatePage() {
  const { user } = useAuth();
  const location = useLocation();
  
  // -- State: Dados do Usuário --
  const [balance, setBalance] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<PlanType>('FREE');
  const [loadingUser, setLoadingUser] = useState(true);

  // -- State: Configurações de Geração --
  const [generationType, setGenerationType] = useState<MediaType>('image');
  const [mode, setMode] = useState<GenMode>('nano');
  
  // -- State: Formulário Guiado (Prompt Builder) --
  const [theme, setTheme] = useState('');
  const [style, setStyle] = useState('');
  const [colors, setColors] = useState('');
  const [details, setDetails] = useState('');

  // -- State: Requisição/Resultado --
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Busca Inicial de Créditos + Listener Realtime
  useEffect(() => {
    if (!user?.id) return;

    const fetchInitialData = async () => {
      setLoadingUser(true);
      try {
        // Fetch Balance using profile_id
        const { data: creditData } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('profile_id', user.id)
          .single();
        setBalance(creditData?.balance ?? 0);

        // Fetch Plan
        const { data: profileData } = await supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', user.id)
          .single();
        if (profileData?.plan_id) setUserPlan(profileData.plan_id as PlanType);

      } catch (err) {
        console.warn("Error loading initial data", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchInitialData();

    // Realtime Subscription for Credits
    const channel = supabase
      .channel('realtime-credits')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_credits',
          filter: `profile_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.balance === 'number') {
            setBalance(payload.new.balance);
            window.dispatchEvent(new Event('profile_updated'));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Preenchimento via Histórico (Re-gerar)
  useEffect(() => {
    if (location.state && (location.state as any).prompt) {
      setTheme((location.state as any).prompt);
    }
  }, [location]);

  // -- Lógica de Negócio --

  const isModeLocked = (m: GenMode): boolean => {
    if (m === 'nano') return false; 
    if (m === 'banana') return userPlan === 'FREE'; 
    if (m === 'flow') return userPlan === 'FREE' || userPlan === 'BASIC'; 
    return false;
  };

  const constructFinalPrompt = () => {
    const parts = [];
    
    if (mode === 'nano') parts.push("simple, minimal details, fast render");
    if (mode === 'flow') parts.push("high quality, 4k, extremely detailed, masterpiece");

    if (theme) parts.push(`Subject: ${theme}`);
    if (style) parts.push(`Art Style: ${style}`);
    if (colors) parts.push(`Color Palette: ${colors}`);
    if (details) parts.push(`Additional Details: ${details}`);
    
    return parts.join(', ');
  };

  const getApiKey = () => {
    // API KEY CONSTANT - As requested
    const staticKey = "AIzaSyC3jfqJZSO5iUoGLV_xuOq1xnHi6Ia9vII"; 
    
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
      }
    } catch (e) {}
    return staticKey;
  };

  const handleSuggestPrompt = async () => {
    if (!theme) {
      setError("Preencha o 'Tema Principal' para receber uma sugestão.");
      return;
    }
    setError(null);
    setIsSuggesting(true);

    try {
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-09-2025',
        contents: `Atue como um diretor de arte criativo.
        Eu tenho este tema inicial: "${theme}".
        Estenda este tema transformando-o em uma descrição visual rica, hiper-detalhada,
        adicionando elementos de iluminação, textura e composição.
        Mantenha a resposta concisa (máximo 3 frases).
        Responda em Inglês.`
      });

      const suggestion = response.text;
      if (suggestion) {
         setDetails(suggestion);
      }
    } catch (err: any) {
      console.error("Gemini Suggestion Error:", err);
      setError("Não foi possível gerar sugestão no momento.");
    } finally {
      setIsSuggesting(false);
    }
  };

  // Função Principal de Geração (Fluxo Estrito: IA -> Histórico -> Dedução -> Exibição)
  const handleGenerate = async () => {
    if (!user?.id) return;
    
    setError(null);
    setResultUrl(null); // Limpa imagem anterior e bloqueia download
    
    const currentCost = COST_MAP[mode];

    if (!theme.trim()) {
      setError("O campo 'Tema Principal' é obrigatório.");
      return;
    }
    if (balance < currentCost) {
      setError(`Saldo insuficiente. Esta geração custa ${currentCost} créditos.`);
      return;
    }
    if (isModeLocked(mode)) {
      setError("Este modo não está disponível no seu plano atual.");
      return;
    }

    setIsGenerating(true);

    try {
      // ---------------------------------------------------------
      // 1. CHAMAR API DE IA (GERAÇÃO)
      // ---------------------------------------------------------
      const apiKey = getApiKey();
      const finalPrompt = constructFinalPrompt();
      const ai = new GoogleGenAI({ apiKey });
      
      let tempImageUrl = null;
      let realModelName = 'gemini-2.5-flash-image';

      if (mode === 'nano') {
        realModelName = 'gemini-2.5-flash-image';
        const response = await ai.models.generateContent({
            model: realModelName,
            contents: { parts: [{ text: finalPrompt }] },
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    tempImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    break;
                }
            }
        }
      } else {
        // Fallback/Placeholder for other models for now using Gemini
        realModelName = 'gemini-2.5-flash-image';
        const response = await ai.models.generateContent({
            model: realModelName,
            contents: { parts: [{ text: finalPrompt }] },
        });
         if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    tempImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    break;
                }
            }
        }
      }
      
      if (!tempImageUrl) {
        throw new Error("A IA não retornou uma imagem válida. Tente ajustar o prompt.");
      }

      // ---------------------------------------------------------
      // 2. SALVAR NO HISTÓRICO (INSERT ATÔMICO - GATEKEEPER)
      // CRÍTICO: Se falhar, paramos TUDO. Nenhuma dedução, nenhuma imagem.
      // ---------------------------------------------------------
      const { error: insertError } = await supabase.from('generations').insert({
        profile_id: user.id,   
        prompt: finalPrompt,
        model_id: realModelName, // Nome real do modelo ou o modo (ex: mode)
        credits_cost: currentCost,
        result_url: tempImageUrl,
        status: 'completed',
        type: 'image' // Obrigatório: 'image'
      });

      if (insertError) {
         console.error("Erro crítico ao salvar histórico:", JSON.stringify(insertError));
         
         // Tratamento de erros de Schema
         if (insertError.code === '22P02') {
             throw new Error(`Erro de Banco de Dados: Valor inválido para coluna Enum (${insertError.message}).`);
         }
         if (insertError.code === '23502') {
             throw new Error("Erro de Banco de Dados: Campo obrigatório faltando.");
         }
         
         // Interrompe o fluxo.
         throw new Error("Falha ao registrar a geração. A operação foi cancelada e nada foi cobrado.");
      }

      // ---------------------------------------------------------
      // 3. DEDUZIR CRÉDITOS (UPDATE DIRETO)
      // Só executa se o INSERT acima passou sem erro
      // ---------------------------------------------------------
      const newBalance = Math.max(0, balance - currentCost);
      const { error: updateError } = await supabase
          .from('user_credits')
          .update({ balance: newBalance })
          .eq('profile_id', user.id);

      if (updateError) {
          console.warn("Aviso: Crédito não descontado devido a erro de rede, mas histórico foi salvo.", updateError);
          // Não paramos aqui, pois a imagem já foi gerada e registrada.
      } else {
          setBalance(newBalance);
          window.dispatchEvent(new Event('profile_updated'));
      }

      // ---------------------------------------------------------
      // 4. SUCESSO FINAL -> LIBERAR IMAGEM NA UI
      // ---------------------------------------------------------
      setResultUrl(tempImageUrl);

    } catch (err: any) {
      console.error("Erro no fluxo de geração:", err);
      setError(err.message || "Ocorreu um erro ao processar sua solicitação.");
      setResultUrl(null); // Garante que a imagem fica oculta em caso de erro
    } finally {
      setIsGenerating(false);
    }
  };

  const currentCost = COST_MAP[mode];
  const canGenerate = theme.trim().length > 0 && balance >= currentCost && !isGenerating && !loadingUser;

  return (
    <div className="h-full bg-background text-slate-50 font-sans p-4 lg:p-6 overflow-hidden flex flex-col">
      <div className="max-w-[1920px] mx-auto w-full h-full flex flex-col">
        
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
           <div>
             <h1 className="text-2xl font-bold text-white flex items-center gap-2">
               <Sparkles className="h-6 w-6 text-primary" /> Painel Criativo
             </h1>
             <p className="text-slate-400 text-xs mt-1">
               {userPlan === 'FREE' ? 'Plano Gratuito' : `Plano ${userPlan}`} • 
               <span className={balance > 0 ? "text-primary ml-1 font-bold" : "text-red-400 ml-1 font-bold"}>
                 {loadingUser ? "..." : balance} Créditos
               </span>
             </p>
           </div>
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 h-full overflow-hidden">
          
          {/* COLUNA ESQUERDA: Configurações */}
          <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-20 lg:pb-0 h-full">
            
            {/* Seletor de Modo */}
            <section className="space-y-2">
              <Label className="text-white text-sm">Modo de Geração</Label>
              <div className="grid grid-cols-1 gap-2">
                {(['nano', 'banana', 'flow'] as GenMode[]).map((m) => {
                  const locked = isModeLocked(m);
                  return (
                    <div 
                      key={m}
                      onClick={() => !locked && setMode(m)}
                      className={cn(
                        "relative border rounded-lg p-3 cursor-pointer transition-all flex items-center justify-between",
                        mode === m && !locked 
                          ? "bg-primary/10 border-primary ring-1 ring-primary/50" 
                          : "bg-surface/50 border-white/5 hover:border-white/20",
                        locked && "opacity-60 cursor-not-allowed bg-surface/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-md flex items-center justify-center",
                          mode === m && !locked ? "bg-primary text-white" : "bg-white/5 text-slate-400"
                        )}>
                          {m === 'nano' && <Rocket className="h-4 w-4" />}
                          {m === 'banana' && <Layers className="h-4 w-4" />}
                          {m === 'flow' && <Zap className="h-4 w-4" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white capitalize flex items-center gap-2">
                            {m} {locked && <Badge variant="destructive" className="h-4 text-[9px] px-1"><Lock className="h-2 w-2 mr-1" /> Upgrade</Badge>}
                          </h3>
                          <p className="text-[10px] text-slate-400">Custo: {COST_MAP[m]} Créditos</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Prompt Builder Guiado */}
            <section className="space-y-4 bg-surface/30 p-5 rounded-lg border border-white/5 shadow-sm">
               <div className="space-y-2">
                 <Label className="flex items-center gap-2 text-primary text-sm">
                   <Lightbulb className="h-3 w-3" /> Tema Principal <span className="text-red-400">*</span>
                 </Label>
                 <Input 
                   value={theme}
                   onChange={(e) => setTheme(e.target.value)}
                   placeholder="Ex: Um astronauta futurista..."
                   className="bg-background/50 border-white/10 focus:border-primary/50"
                 />
               </div>

               <div className="space-y-2">
                 <Label className="text-sm">Estilo Artístico</Label>
                 <select 
                   value={style}
                   onChange={(e) => setStyle(e.target.value)}
                   className="w-full h-10 rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                 >
                   <option value="">Selecione...</option>
                   <option value="Photorealistic">Realista</option>
                   <option value="Cinematic">Cinematográfico</option>
                   <option value="Anime">Anime/Mangá</option>
                   <option value="3D Render">3D Render</option>
                   <option value="Cyberpunk">Cyberpunk</option>
                   <option value="Oil Painting">Pintura a Óleo</option>
                 </select>
               </div>

               <div className="space-y-2">
                 <Label className="flex items-center gap-2 text-sm">
                   <Palette className="h-3 w-3" /> Cores Dominantes
                 </Label>
                 <Input 
                   value={colors}
                   onChange={(e) => setColors(e.target.value)}
                   placeholder="Ex: Neon blue, Sunset orange..."
                   className="bg-background/50 border-white/10 focus:border-primary/50"
                 />
               </div>

               <div className="space-y-2">
                 <Label className="text-sm">Detalhes Adicionais</Label>
                 <Textarea 
                   value={details}
                   onChange={(e) => setDetails(e.target.value)}
                   placeholder="Iluminação, ângulo da câmera, humor..."
                   className="bg-background/50 border-white/10 min-h-[80px] resize-none focus:border-primary/50"
                 />
               </div>
            </section>

            {/* Prompt Display */}
            <section className="bg-black/30 p-3 rounded-lg border border-white/5 space-y-3">
              <Label className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                 <FileCode className="h-3 w-3" /> Prompt Final Gerado
              </Label>
              <p className="text-xs text-slate-300 font-mono break-words leading-relaxed max-h-24 overflow-y-auto">
                {constructFinalPrompt() || "O prompt será exibido aqui..."}
              </p>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSuggestPrompt}
                disabled={isSuggesting || !theme.trim()}
                className="w-full border-primary/30 text-primary hover:bg-primary/10 hover:text-primary text-xs h-8"
              >
                 {isSuggesting ? (
                     <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" /> Pensando...
                     </>
                 ) : (
                     <>
                        <Sparkles className="h-3 w-3 mr-2" /> Sugestão de Prompt por IA
                     </>
                 )}
              </Button>
            </section>

            {/* Botão de Ação */}
            <div className="space-y-4 pt-2 mt-auto">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleGenerate} 
                disabled={!canGenerate}
                className={cn(
                  "w-full h-14 text-base font-bold shadow-lg transition-all",
                  (balance < currentCost)
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-dark shadow-primary/20"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando...
                  </>
                ) : balance < currentCost ? (
                   "Créditos Insuficientes"
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" /> 
                    Gerar (-{currentCost} {currentCost > 1 ? 'Créditos' : 'Crédito'})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* COLUNA DIREITA: Preview */}
          <div className="flex flex-col h-full gap-4 overflow-hidden">
            
            <div className="flex bg-surface/50 p-1 rounded-lg border border-white/5 w-fit shrink-0">
              <button
                onClick={() => setGenerationType('image')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  generationType === 'image' 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                <ImageIcon className="h-4 w-4" /> Imagem
              </button>
              <button
                onClick={() => setGenerationType('video')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  generationType === 'video' 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Video className="h-4 w-4" /> Vídeo
              </button>
            </div>

            <div className="flex-1 rounded-xl border border-white/10 bg-surface/30 relative overflow-hidden flex items-center justify-center p-4 shadow-inner bg-black/40 min-h-[400px]">
               
               <div className="absolute inset-0 opacity-10 pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}>
               </div>

               {generationType === 'video' ? (
                 <div className="text-center z-10 animate-in fade-in zoom-in">
                    <div className="w-16 h-16 bg-surface/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <Video className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white">Vídeo Indisponível</h3>
                    <p className="text-slate-400 text-sm mt-2">
                      Geração de Vídeo não disponível no momento. <br/> Retorne à aba Imagem.
                    </p>
                 </div>
               ) : (
                 <>
                   {resultUrl ? (
                     <div className="relative w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                        <img 
                          src={resultUrl} 
                          alt="Resultado Gerado" 
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-full h-full object-contain rounded-lg shadow-2xl border border-white/10"
                          style={{ aspectRatio: '1/1' }}
                        />
                        <div className="absolute bottom-4 flex gap-3 bg-black/60 p-2 rounded-lg backdrop-blur-md border border-white/10">
                           <a href={resultUrl} download="criativo-io-result.jpg">
                             <Button size="sm" className="bg-primary hover:bg-primary-dark h-8 text-xs">
                               <Download className="h-3 w-3 mr-2" /> Baixar
                             </Button>
                           </a>
                           <Button size="sm" variant="outline" onClick={() => setResultUrl(null)} className="h-8 text-xs border-white/20 text-white hover:bg-white/10">
                             <RefreshCw className="h-3 w-3 mr-2" /> Novo
                           </Button>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center max-w-md z-10">
                        <div className="w-20 h-20 bg-surface/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-lg">
                           {isGenerating ? (
                             <Loader2 className="h-8 w-8 text-primary animate-spin" />
                           ) : (
                             <ImageIcon className="h-8 w-8 text-slate-600" />
                           )}
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">
                          {isGenerating ? "Criando sua arte..." : "Sua arte aparecerá aqui"}
                        </h2>
                        <p className="text-sm text-slate-400">
                          {isGenerating 
                            ? "A IA está processando seu pedido. Isso leva alguns segundos." 
                            : "Configure seu prompt à esquerda e clique em Gerar."}
                        </p>
                     </div>
                   )}
                 </>
               )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
