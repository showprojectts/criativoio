
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../components/providers/AuthProvider';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Download, Trash2, RefreshCw, MoreVertical, Calendar, Zap, AlertCircle, Search, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';

interface Generation {
  id: string;
  created_at: string;
  prompt: string;
  result_url: string;
  model_id: string;
  credits_cost: number;
}

export default function HistoryPage() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchGenerations();
    
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [user]);

  const fetchGenerations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch generations from Supabase
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('profile_id', user.id) // Changed from user_id to profile_id
        .order('created_at', { ascending: false });

      if (error) {
        const errorMsg = error.message || JSON.stringify(error);
        if (errorMsg.includes("Failed to fetch")) {
            throw new Error("Network Error");
        }
        if (error.code !== '42P01') { 
             console.error('Supabase fetch failed:', errorMsg);
        }
        setGenerations([]);
        return; 
      }

      setGenerations(data && data.length > 0 ? data : []);
    } catch (err: any) {
      if (err.message === "Network Error" || err.message.includes("Failed to fetch")) {
          setError("Erro de conexão. Verifique sua internet.");
      } else {
          console.error('Error fetching history:', err.message || err);
          setError("Não foi possível carregar o histórico.");
      }
      setGenerations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    setGenerations(prev => prev.filter(g => g.id !== id));
    
    const { error } = await supabase.from('generations').delete().eq('id', id);
    if (error) {
      console.error('Error deleting:', error);
      fetchGenerations(); 
    }
  };

  const handleRegenerate = (e: React.MouseEvent, prompt: string) => {
    e.stopPropagation();
    navigate('/create', { state: { prompt } });
  };

  const handleDownload = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `criativo-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background text-slate-50 font-sans">

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Histórico de Criações</h1>
            <p className="text-slate-400">Gerencie e organize seus ativos gerados.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchGenerations} 
            className="border-white/10 hover:bg-white/5 text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
            {error.includes("conexão") ? <WifiOff className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-primary h-10 w-10" />
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-surface/30">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface mb-4">
              <Search className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum criativo encontrado</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Você ainda não gerou nenhuma imagem ou vídeo. Comece agora a criar campanhas de alta conversão.
            </p>
            <Button onClick={() => navigate('/create')} className="bg-primary hover:bg-primary-dark">
              Criar meu primeiro Criativo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generations.map((gen) => (
              <Card key={gen.id} className="group overflow-hidden bg-surface border-white/5 hover:border-primary/50 transition-all duration-300 relative">
                
                {/* Image Area */}
                <div className="aspect-square bg-black/50 relative overflow-hidden">
                  <img 
                    src={gen.result_url} 
                    alt="Creative Result" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Floating Action Button */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                      <button 
                        onClick={(e) => toggleMenu(e, gen.id)}
                        className="p-1.5 rounded-full bg-black/60 text-white hover:bg-primary transition-colors backdrop-blur-sm"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {/* Simple Custom Dropdown */}
                      {openMenuId === gen.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-surface border border-white/10 rounded-md shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                          <button 
                            onClick={(e) => handleDownload(e, gen.result_url, gen.id)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2 first:rounded-t-md"
                          >
                            <Download className="h-4 w-4" /> Baixar
                          </button>
                          <button 
                            onClick={(e) => handleRegenerate(e, gen.prompt)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                          >
                            <RefreshCw className="h-4 w-4" /> Re-gerar
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, gen.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 last:rounded-b-md"
                          >
                            <Trash2 className="h-4 w-4" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">
                      {gen.model_id || gen.model_used || "Unknown"}
                    </Badge>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(gen.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed" title={gen.prompt}>
                    {gen.prompt}
                  </p>
                </CardContent>

                <CardFooter className="px-4 pb-4 pt-0 flex justify-between items-center">
                   <div className="flex items-center text-xs text-slate-500">
                      <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                      {gen.credits_cost} tokens
                   </div>
                   <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={(e) => handleDownload(e, gen.result_url, gen.id)}
                      className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
                   >
                     Download
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
