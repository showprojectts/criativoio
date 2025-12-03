import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import Logo from '../shared/Logo';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../../lib/supabase/client';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Zap, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  User as UserIcon,
  CreditCard,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  onCollapse: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('');

  // Função dedicada e segura para buscar saldo
  const fetchUserCredits = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('profile_id', userId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Ignorar erro de "nenhuma linha encontrada" (usuário novo)
           console.warn("Sidebar: Erro ao buscar créditos:", error.message);
        }
        setBalance(0);
      } else {
        setBalance(data?.balance ?? 0);
      }
    } catch (err) {
      // Captura erros de rede (TypeError: Failed to fetch)
      console.warn("Sidebar: Falha de rede ao buscar créditos. Tentando novamente em breve.");
    }
  };

  // Função para buscar perfil
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin, avatar_url, full_name')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn("Sidebar: Erro ao buscar perfil:", error.message);
      }

      setIsAdmin(!!profile?.is_admin);
      setAvatarUrl(profile?.avatar_url || null);
      setFullName(profile?.full_name || user?.user_metadata?.full_name || 'Usuário');
    } catch (err) {
      console.warn("Sidebar: Falha de rede ao buscar perfil.");
    }
  };

  // Inicialização e Listeners
  useEffect(() => {
    if (user?.id) {
      // Executa buscas iniciais
      fetchUserCredits(user.id);
      fetchUserProfile(user.id);
    }
  }, [user]);

  // Listener global para atualizar dados sem recarregar a página
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (user?.id) {
        fetchUserCredits(user.id);
        fetchUserProfile(user.id);
      }
    };

    window.addEventListener('profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile_updated', handleProfileUpdate);
    };
  }, [user]);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onCollapse(newState);
    setProfileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-surface border-r border-white/5 transition-all duration-300 flex flex-col",
        collapsed ? "w-[70px]" : "w-[250px]"
      )}
    >
      {/* 1. Header & Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5 justify-between">
        <Link to="/dashboard" className="flex items-center justify-center w-full">
           <Logo collapsed={collapsed} />
        </Link>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-primary text-white rounded-full p-1 shadow-md hover:bg-primary-dark transition-colors border border-surface"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* 2. Primary Navigation */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        
        <div className="mb-6">
          <Link to="/create">
            <Button 
              className={cn(
                "w-full bg-primary hover:bg-primary-dark transition-all shadow-[0_0_15px_rgba(0,167,225,0.2)]",
                collapsed ? "px-0 justify-center" : "justify-start px-4 gap-2"
              )}
            >
              <PlusCircle className="h-5 w-5" />
              {!collapsed && <span>Novo Criativo</span>}
            </Button>
          </Link>
        </div>

        <nav className="space-y-1">
          <NavItem 
            to="/dashboard" 
            icon={LayoutDashboard} 
            label="Dashboard" 
            collapsed={collapsed} 
            active={isActive('/dashboard')} 
          />
          <NavItem 
            to="/history" 
            icon={History} 
            label="Histórico" 
            collapsed={collapsed} 
            active={isActive('/history')} 
          />
          <NavItem 
            to="/plans" 
            icon={Zap} 
            label="Planos" 
            collapsed={collapsed} 
            active={isActive('/plans')} 
          />
        </nav>
      </div>

      {/* 3. User Footer */}
      <div className="border-t border-white/5 p-3 relative">
        <button 
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className={cn(
            "flex items-center w-full rounded-lg hover:bg-white/5 transition-colors p-2 text-left",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/20 overflow-hidden">
            {avatarUrl ? (
               <img src={avatarUrl} alt="User" className="h-full w-full object-cover" />
            ) : (
               <UserIcon className="h-5 w-5" />
            )}
          </div>
          
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {fullName}
              </p>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                 {balance === null ? (
                   <span className="animate-pulse">...</span>
                 ) : balance === 0 ? (
                   <span className="text-red-400">0 Créditos</span>
                 ) : (
                   <>
                    <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" /> {balance.toLocaleString()} Tokens
                   </>
                 )}
              </p>
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        {profileMenuOpen && (
           <>
            <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)}></div>
            
            <div className="absolute bottom-full left-3 w-64 bg-surface border border-white/10 rounded-xl shadow-2xl p-2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2">
               <div className="px-3 py-2 border-b border-white/5 mb-2">
                 <p className="text-xs font-bold text-slate-500 uppercase">Minha Conta</p>
               </div>
               
               {isAdmin && (
                 <Link to="/admin/dashboard" className="flex items-center gap-2 w-full p-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-white/5 rounded-md font-medium">
                   <ShieldAlert className="h-4 w-4" /> Painel Admin
                 </Link>
               )}

               <Link to="/settings/profile" className="flex items-center gap-2 w-full p-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-md">
                 <Settings className="h-4 w-4" /> Configurações
               </Link>
               
               <Link to="/plans" className="flex items-center gap-2 w-full p-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-md">
                 <CreditCard className="h-4 w-4" /> Assinaturas
               </Link>
               
               <a href="#" className="flex items-center gap-2 w-full p-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-md">
                 <HelpCircle className="h-4 w-4" /> Ajuda & Suporte
               </a>
               
               <div className="h-px bg-white/5 my-1"></div>
               
               <button 
                 onClick={handleLogout}
                 className="flex items-center gap-2 w-full p-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md"
               >
                 <LogOut className="h-4 w-4" /> Sair
               </button>
            </div>
           </>
        )}
      </div>
    </aside>
  );
};

const NavItem = ({ to, icon: Icon, label, collapsed, active }: any) => (
  <Link to={to}>
    <div 
      className={cn(
        "flex items-center py-2.5 rounded-md transition-all group",
        active 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-slate-400 hover:text-white hover:bg-white/5",
        collapsed ? "justify-center px-0" : "px-3 gap-3"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className={cn("h-5 w-5", active && "text-primary")} />
      {!collapsed && <span>{label}</span>}
      {active && !collapsed && (
        <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"></div>
      )}
    </div>
  </Link>
);

export default Sidebar;