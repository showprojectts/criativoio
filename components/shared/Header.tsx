import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import Logo from './Logo';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    if (window.location.hash !== '#/') {
        navigate('/');
        setTimeout(() => {
            const section = document.getElementById(id);
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        const section = document.getElementById(id);
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-white/5 py-4 shadow-sm transition-all">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to={session ? "/dashboard" : "/"} className="flex items-center gap-2 cursor-pointer select-none">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">
                Funcionalidades
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">
                Preços
            </button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
                <Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/5">
                Login
                </Button>
            </Link>
            <Link to="/signup">
                <Button className="bg-primary hover:bg-primary-dark text-white font-medium shadow-[0_0_15px_rgba(0,167,225,0.3)]">
                Começar Grátis
                </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-200">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-4 shadow-xl animate-in slide-in-from-top-5">
          <nav className="flex flex-col gap-4">
            <button onClick={() => scrollToSection('features')} className="text-left text-sm font-medium text-slate-300 p-2 hover:bg-white/5 rounded-md">
                Funcionalidades
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-left text-sm font-medium text-slate-300 p-2 hover:bg-white/5 rounded-md">
                Preços
            </button>
            <div className="h-px bg-border my-2"></div>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white">
                Login
                </Button>
            </Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary-dark text-white">
                Começar Grátis
                </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;