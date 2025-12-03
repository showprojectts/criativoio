
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../components/providers/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';
import { Loader2, Check, AlertCircle, Upload, Camera, Trash2 } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Remove Photo Modal State
  const [isRemovePhotoModalOpen, setIsRemovePhotoModalOpen] = useState(false);

  useEffect(() => {
    async function getProfile() {
      if (!user) return;

      try {
        setLoading(true);
        
        // 1. Fetch Profile Data
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, email') 
          .eq('id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // Result contains 0 rows
             // Fallback to auth metadata if profile doesn't exist yet
             setFullName(user.user_metadata?.full_name || '');
             setEmail(user.email || '');
             setAvatarUrl(null);
             return;
          }
          if (error.code === '42703') { // Column does not exist fallback
             const { data: retryData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', user.id)
              .single();
             
             setFullName(retryData?.full_name || user.user_metadata?.full_name || '');
             setEmail(user.email || '');
             setAvatarUrl(null);
             return;
          }
          console.error('Error loading profile:', error.message || JSON.stringify(error));
        }

        // 2. Set State
        setFullName(data?.full_name || user.user_metadata?.full_name || '');
        setEmail(user.email || '');
        
        if (data && data.avatar_url) {
            setAvatarUrl(data.avatar_url);
        } else {
            setAvatarUrl(null);
        }

      } catch (error: any) {
        console.error('Error loading user data:', error.message || JSON.stringify(error));
        if (error.code === '42P01') {
            setMessage({ type: 'error', text: 'Tabela "profiles" não encontrada. Verifique o banco de dados.' });
        }
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [user]);

  // Helper to trigger sidebar update
  const triggerGlobalUpdate = () => {
    window.dispatchEvent(new Event('profile_updated'));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    setMessage(null);

    try {
      // Using update instead of upsert to avoid RLS insert issues if row exists
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      triggerGlobalUpdate(); 
      setTimeout(() => setMessage(null), 3000);

    } catch (error: any) {
      console.error(error);
      if (error.code === '42501') {
          setMessage({ 
              type: 'error', 
              text: 'Erro de Permissão (RLS). Execute o script SQL de correção.' 
          });
      } else {
          setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil.' });
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }

    try {
      setUploading(true);
      setMessage(null);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Use standard filename to prevent buildup
      const filePath = `${user.id}/avatar.${fileExt}`;

      const bucketName = 'avatares';

      // 1. Upload to bucket
      const { error: uploadError } = await supabase.storage
        .from(bucketName) 
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
          if (uploadError.message.includes("Bucket not found")) {
              throw new Error(`Bucket '${bucketName}' não existe.`);
          }
          throw uploadError;
      }

      // 2. Get Public URL with timestamp for cache busting
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const urlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;

      // 3. Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithTimestamp })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // 4. Update State
      setAvatarUrl(urlWithTimestamp);
      triggerGlobalUpdate(); 
      setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });

    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer upload da imagem.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- LOGICA DE REMOÇÃO DE FOTO ---
  const handleRemoveAvatar = async () => {
    if (!user) return;
    
    setUploading(true);
    setMessage(null);
    setIsRemovePhotoModalOpen(false); // Fecha o modal

    try {
        const bucketName = 'avatares';

        // 1. LIMPEZA DO BANCO DE DADOS (Prioridade Máxima)
        // Fazemos isso primeiro para garantir que a UI atualize mesmo se o Storage falhar
        const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', user.id);

        if (dbError) throw dbError;

        // Atualiza UI Imediatamente
        setAvatarUrl(null);
        triggerGlobalUpdate();
        setMessage({ type: 'success', text: 'Foto removida com sucesso.' });

        // 2. REMOÇÃO DO ARQUIVO (Best Effort)
        if (avatarUrl) {
            let filePath = '';
            try {
                // Tenta extrair o caminho relativo da URL
                // Ex: .../storage/v1/object/public/avatares/USER_ID/avatar.png
                if (avatarUrl.includes(bucketName)) {
                     const parts = avatarUrl.split(`/${bucketName}/`);
                     if (parts[1]) {
                         filePath = parts[1].split('?')[0]; // Remove query params
                     }
                }
            } catch (e) {
                console.warn("Erro ao parsear URL do avatar:", e);
            }

            if (filePath) {
                const { error: removeError } = await supabase.storage
                    .from(bucketName)
                    .remove([filePath]);
                
                if (removeError) {
                    console.error("Erro ao deletar arquivo do storage:", removeError);
                    // Não lançamos throw aqui para não reverter o sucesso visual
                }
            }
        }

    } catch (error: any) {
        console.error("Erro crítico ao remover avatar:", error);
        setMessage({ type: 'error', text: error.message || 'Erro ao remover foto.' });
        // Em caso de erro no DB, tentamos recuperar o estado (opcional, mas seguro)
        // getProfile(); 
    } finally {
        setUploading(false);
    }
  };

  // --- LOGICA DE EXCLUSÃO DE CONTA (RPC) ---
  const handleConfirmDelete = async () => {
      if (!user) return;
      
      setIsDeleting(true);
      setMessage(null);

      try {
          const userId = user.id;
          console.log("Iniciando exclusão de conta via RPC para:", userId);

          // 1. Limpar Dados Dependentes (Opcional, mas seguro se o cascade falhar)
          await supabase.from('generations').delete().eq('profile_id', userId);
          await supabase.from('user_credits').delete().eq('profile_id', userId);
          await supabase.from('profiles').delete().eq('id', userId);

          // 2. Chamar API Serverless para deletar usuário da Auth (Admin Privileges)
          // Isso é mais seguro que RPC direto em alguns casos onde o user já perdeu permissões de perfil
          const response = await fetch('/api/delete-account', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            }
          });

          // Check if response is actually JSON before parsing (handles HTML errors from Vite/Vercel)
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
              const data = await response.json();
              if (!response.ok) {
                throw new Error(data.error || "Erro ao excluir conta.");
              }
          } else {
              // If not JSON, it's likely a 500/404 HTML error page
              if (!response.ok) throw new Error(`Erro na API (${response.statusText})`);
          }

      } catch (err: any) {
          console.error("Erro no fluxo de exclusão:", err);
          // Mesmo com erro, tentamos o logout forçado abaixo
      } finally {
          // 3. Logout Forçado e Redirecionamento (Fluxo Final)
          // Executamos isso independentemente de erros para garantir que a sessão morra
          try {
             await supabase.auth.signOut();
             localStorage.clear(); // Limpeza extra
             window.location.href = '/'; // Redirect to Home (Landing Page)
          } catch {
             // Se falhar o signOut, forçamos o refresh para Home
             window.location.href = '/';
          }
      }
  };

  if (loading) {
    return <div className="py-10 flex justify-center"><Spinner className="text-primary h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      
      <Card className="bg-surface border-white/5">
        <CardHeader>
          <CardTitle className="text-white">Perfil e Informações Básicas</CardTitle>
          <CardDescription>
            Isso é como os outros usuários verão você na plataforma.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-700 border-2 border-white/10 flex items-center justify-center shadow-lg">
                    {avatarUrl ? (
                        <img 
                            src={avatarUrl} 
                            alt="Avatar" 
                            className="h-full w-full object-cover"
                            key={avatarUrl} // Force re-render on URL change
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <span className="text-3xl font-bold text-slate-400">{fullName?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                </div>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <Camera className="h-8 w-8 text-white" />
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarUpload} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>
            
            <div className="space-y-2">
                <div>
                    <h3 className="text-sm font-medium text-white">Foto de Perfil</h3>
                    <p className="text-xs text-slate-400">JPG, GIF ou PNG. Máximo de 2MB.</p>
                </div>
                
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-white/10 text-slate-300 hover:text-white"
                    >
                        {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-2"/> : <Upload className="h-3 w-3 mr-2" />}
                        Trocar Foto
                    </Button>

                    {avatarUrl && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={uploading}
                            onClick={() => setIsRemovePhotoModalOpen(true)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Remover
                        </Button>
                    )}
                </div>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full"></div>

          {message && (
             <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : ''}>
               {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
               <AlertTitle>{message.type === 'error' ? 'Erro' : 'Sucesso'}</AlertTitle>
               <AlertDescription>{message.text}</AlertDescription>
             </Alert>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                className="max-w-md bg-background/50 border-white/10" 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                value={email} 
                readOnly 
                disabled 
                className="max-w-md bg-background/30 border-white/5 text-slate-500 cursor-not-allowed" 
              />
              <p className="text-xs text-slate-500">Para alterar seu e-mail, entre em contato com o suporte.</p>
            </div>

            <Button type="submit" disabled={updating} className="bg-primary hover:bg-primary-dark mt-2">
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>

        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-surface border-red-500/20">
        <CardHeader>
           <CardTitle className="text-red-400 text-lg">Zona de Perigo</CardTitle>
           <CardDescription>
             Ações irreversíveis que afetam sua conta.
           </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                 <p className="text-white font-medium">Excluir Conta</p>
                 <p className="text-sm text-slate-400">Todos os seus dados, créditos e histórico serão apagados permanentemente.</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50"
              >
                 <Trash2 className="mr-2 h-4 w-4" />
                 Excluir Conta
              </Button>
           </div>
        </CardContent>
      </Card>

      {/* Modal: Delete Account Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão de Conta"
        description="Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta, créditos e todos os criativos gerados."
        variant="destructive"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                  </>
              ) : (
                  "Confirmar Exclusão Definitiva"
              )}
            </Button>
          </>
        }
      >
        <div className="py-2 space-y-2">
            <p className="text-sm text-white bg-red-500/10 border border-red-500/20 p-3 rounded-md">
                <AlertCircle className="inline h-4 w-4 mr-2 mb-0.5" />
                Atenção: Você perderá acesso imediato e seus dados não poderão ser recuperados.
            </p>
        </div>
      </Modal>

      {/* Modal: Remove Photo Confirmation */}
      <Modal
        isOpen={isRemovePhotoModalOpen}
        onClose={() => setIsRemovePhotoModalOpen(false)}
        title="Remover Foto de Perfil"
        description="Tem certeza que deseja remover sua foto? O avatar padrão será exibido."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsRemovePhotoModalOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemoveAvatar} disabled={uploading}>
              {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removendo...
                  </>
              ) : (
                  "Sim, Remover Foto"
              )}
            </Button>
          </>
        }
      >
      </Modal>

    </div>
  );
}
