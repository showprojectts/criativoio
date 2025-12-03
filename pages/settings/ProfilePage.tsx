
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
  const { user, signOut } = useAuth();
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
          console.error('Error loading profile:', error);
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
        console.error('Error loading user data:', error.message || error);
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
    // This event acts like router.refresh() for our Sidebar component
    window.dispatchEvent(new Event('profile_updated'));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    setMessage(null);

    try {
      const updates = {
        full_name: fullName,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
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
      
      // Use a consistent path structure but append query param later to bust cache
      const filePath = `${user.id}/avatar.${fileExt}`;

      // 1. Upload to 'avatares' bucket (Upsert true to overwrite)
      const { error: uploadError } = await supabase.storage
        .from('avatares') 
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
          if (uploadError.message.includes("Bucket not found")) {
              throw new Error("Bucket 'avatares' não existe.");
          }
          throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatares')
        .getPublicUrl(filePath);

      // 3. Cache Busting: Add timestamp to force browser to reload image
      const urlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;

      // 4. Update Profile in DB with the Timestamped URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithTimestamp })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // 5. Update Local & Global State
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

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return;
    
    if (!window.confirm("Tem certeza que deseja remover sua foto de perfil?")) return;

    setUploading(true);
    setMessage(null);

    // Keep reference for cleanup
    const urlToDelete = avatarUrl;

    try {
        // 1. DATABASE UPDATE (First priority for persistence)
        const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', user.id);

        if (dbError) throw dbError;

        // 2. STATE UPDATE (Immediate Feedback)
        setAvatarUrl(null);
        triggerGlobalUpdate();
        
        // 3. STORAGE CLEANUP (Best effort)
        try {
            const bucketName = 'avatares';
            // Extract the path from the URL (ignoring query params)
            // URL format: .../avatares/USER_ID/FILE.ext?t=...
            const cleanUrl = urlToDelete.split('?')[0]; 
            const urlParts = cleanUrl.split(`/${bucketName}/`);
            
            if (urlParts.length > 1) {
                const relativePath = decodeURIComponent(urlParts[1]);
                const { error: removeError } = await supabase.storage
                    .from(bucketName)
                    .remove([relativePath]);
                
                if (removeError) console.warn("Storage remove warning:", removeError);
            }
        } catch (storageErr) {
            console.warn("Error parsing URL for deletion:", storageErr);
        }

        setMessage({ type: 'success', text: 'Foto removida com sucesso.' });

    } catch (error: any) {
        console.error("Error removing avatar:", error);
        setMessage({ type: 'error', text: error.message || 'Erro ao remover foto.' });
        // Revert local state if DB failed
        setAvatarUrl(urlToDelete);
    } finally {
        setUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
      if (!user) return;
      
      setIsDeleting(true);
      setMessage(null);

      try {
          // 1. Client-side Avatar Cleanup
          if (avatarUrl) {
              try {
                  const bucketName = 'avatares';
                  const cleanUrl = avatarUrl.split('?')[0];
                  const urlParts = cleanUrl.split(`/${bucketName}/`);
                  if (urlParts.length > 1) {
                      await supabase.storage.from(bucketName).remove([decodeURIComponent(urlParts[1])]);
                  }
              } catch (storageErr) {
                  console.warn("Avatar cleanup failed, proceeding...", storageErr);
              }
          }

          // 2. Server-side Data & Auth Deletion
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) throw new Error("Sessão inválida. Faça login novamente.");

          const response = await fetch('/api/delete-account', {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || "Falha ao excluir conta.");
          }

          // 3. Logout
          await signOut();
          window.location.href = '/';
          
      } catch (err: any) {
          console.error("Error deleting account:", err);
          setMessage({ 
              type: 'error', 
              text: err.message || 'Erro crítico ao excluir conta.' 
          });
      } finally {
          setIsDeleting(false);
          // Don't close modal on error so user sees the message
      }
  };

  const handleCloseDeleteModal = () => {
      setIsDeleteModalOpen(false);
      setMessage(null);
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
                            // Adding key forces re-render if url changes
                            key={avatarUrl} 
                            onError={(e) => {
                                // Fallback if image fails to load
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
                            onClick={handleRemoveAvatar}
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

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Confirmar Exclusão de Conta"
        description="Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta, créditos e todos os criativos gerados."
        variant="destructive"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseDeleteModal} disabled={isDeleting}>
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

    </div>
  );
}
