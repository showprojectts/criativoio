import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { cn } from '../../lib/utils';
import { useAuth } from '../providers/AuthProvider';
import { Spinner } from '../ui/Spinner';

const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  // Double check auth just in case AuthGuard missed something (unlikely but safe)
  if (!session) {
     return null; 
  }

  return (
    <div className="min-h-screen bg-background text-slate-50 font-sans flex">
      {/* 1. Sidebar */}
      <Sidebar onCollapse={setSidebarCollapsed} />

      {/* 2. Main Content Wrapper */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen flex flex-col",
          sidebarCollapsed ? "ml-[70px]" : "ml-[250px]"
        )}
      >
        {/* 
           The Outlet renders the child route's element (Dashboard, Create, etc.)
           We add padding here to ensure content doesn't touch the edges immediately 
           and handle the mobile responsiveness if needed later.
        */}
        <div className="flex-1 w-full max-w-7xl mx-auto">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
