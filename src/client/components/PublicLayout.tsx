import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { ShieldCheck, Menu, X, LogOut, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface PublicLayoutProps {
  children: ReactNode;
}

const navLinks = [
  { label: 'Início', href: '/' },
  { label: 'Cursos', href: '/#cursos' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Contato', href: '/contato' },
];

export function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthContext();
  const { count } = useCart();
  const { siteLogo } = useSiteSettings();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-black h-20 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
          <img
            src={siteLogo}
            alt="CASEG Protege"
            className="h-20 w-auto object-contain scale-150 origin-left"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`font-body font-medium text-sm uppercase tracking-wide transition-colors ${
                link.highlight
                  ? 'text-brand font-bold hover:text-black'
                  : 'hover:text-brand'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/cart" className="relative group">
            <div className="p-2.5 border-2 border-black rounded-xl bg-white shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150">
              <ShoppingCart size={20} className="text-black group-hover:text-brand transition-colors" />
            </div>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-brand text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-black">
                {count}
              </span>
            )}
          </Link>
          <Link to="/portal-corporativo">
            <button className="bg-emerald-500 text-white font-display font-bold text-sm uppercase tracking-wide px-5 py-2.5 rounded-xl border-2 border-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150">
              Portal Corporativo
            </button>
          </Link>
          {isAuthenticated ? (
            <>
              <span className="font-body text-sm font-medium text-gray-600 hidden lg:block">
                Olá, {user?.name?.split(' ')[0]}
              </span>
              {user?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="primary" size="sm">
                    <ShieldCheck size={16} className="mr-1.5" />
                    Painel Admin
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard size={16} className="mr-1.5" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={logout}>
                <LogOut size={16} className="mr-1.5" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">Entrar</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Cadastrar</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 border-2 border-black brutal-shadow active:translate-y-[2px] active:shadow-none transition-all"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b-2 border-black shadow-brutal p-4 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`font-body font-bold text-lg uppercase tracking-wide py-2 border-b border-gray-100 last:border-0 transition-colors ${
                  link.highlight
                    ? 'text-brand hover:text-black'
                    : 'hover:text-brand'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-3 pt-2">
            <Link to="/portal-corporativo" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full bg-emerald-500 text-white font-display font-bold text-sm uppercase tracking-wide px-5 py-3 rounded-xl border-2 border-black shadow-brutal active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150">
                Portal Corporativo
              </button>
            </Link>
            {isAuthenticated ? (
              <>
                <p className="font-body text-sm font-medium text-gray-600 px-1">
                  Olá, {user?.name?.split(' ')[0]}
                </p>
                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full justify-center">
                      <ShieldCheck size={16} className="mr-1.5" />
                      Painel Admin
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    <LayoutDashboard size={16} className="mr-1.5" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="primary" className="w-full justify-center" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                  <LogOut size={16} className="mr-1.5" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">Entrar</Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center">Cadastrar</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(22,101,52,0.12),transparent_28%),linear-gradient(180deg,_#f0fdf4,_#ecfccb)] text-black selection:bg-brand selection:text-white">
      <PublicHeader />

      <main className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
