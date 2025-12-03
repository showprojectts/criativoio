import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { User, Shield, CreditCard, Sparkles, Bell } from 'lucide-react';

const sidebarNavItems = [
  {
    title: "Perfil",
    href: "/settings/profile",
    icon: User
  },
  {
    title: "Segurança",
    href: "/settings/security",
    icon: Shield
  },
  {
    title: "Planos e Faturamento",
    href: "/settings/billing",
    icon: CreditCard
  },
  {
    title: "Configurações de IA",
    href: "/settings/ai",
    icon: Sparkles
  },
  {
    title: "Notificações",
    href: "/settings/notifications",
    icon: Bell
  },
];

interface SettingsLayoutProps {
  children?: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-0.5 mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white">Configurações</h2>
        <p className="text-slate-400">
          Gerencie as configurações da sua conta e preferências.
        </p>
      </div>
      
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto px-4 lg:px-0 scrollbar-hide">
            {sidebarNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 justify-start rounded-md p-2 text-sm font-medium transition-colors whitespace-nowrap",
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
        
        <div className="flex-1 lg:max-w-3xl">
            <div className="bg-surface/30 border border-white/5 rounded-xl p-1 md:p-0">
               {children || <Outlet />}
            </div>
        </div>
      </div>
    </div>
  );
}