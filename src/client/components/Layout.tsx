import { ReactNode, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { Button } from './Button';
import { ShieldCheck, LogOut, Menu, X, BookOpen, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface LayoutProps {
  children: ReactNode;
}

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'Cursos', icon: BookOpen },
];

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { siteLogo } = useSiteSettings();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(22,101,52,0.14),transparent_20%),linear-gradient(180deg,_#f0fdf4,_#ecfdf5)]">
      <header className="sticky top-0 z-50 bg-white border-b-2 border-black h-20 shadow-brutal-sm">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src={siteLogo}
              alt="CASEG Protege"
              className="h-24 w-auto object-contain"
            />
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black rounded-xl shadow-brutal-sm hover:bg-gray-50 transition-colors text-sm font-display font-bold uppercase tracking-wide"
            >
              ← Início
            </Link>
            <div className="flex items-center gap-3 bg-white border-2 border-black rounded-xl shadow-brutal px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-gray-500">Bem-vindo,</span>
              <span className="font-display font-bold uppercase">{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="gap-2">
              <LogOut size={16} />
              Sair
            </Button>
          </div>

          <button
            type="button"
            className="md:hidden w-12 h-12 border-2 border-black bg-white flex items-center justify-center"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {sidebarOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:flex md:w-64 flex-col border-r-2 border-black bg-white">
          <nav className="px-4 py-6 space-y-3">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 font-display font-bold text-sm uppercase tracking-wide border-2 rounded-xl transition-all',
                    isActive
                      ? 'bg-brand text-white border-black shadow-brutal-sm translate-x-1'
                      : 'bg-white text-black border-black hover:bg-gray-50'
                  )}
                >
                  <link.icon size={18} strokeWidth={2.5} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-4 py-6 border-t-2 border-black">
            <p className="font-display font-bold text-sm uppercase">{user?.name}</p>
            <p className="font-body text-xs text-gray-500 mt-1">
              {user?.role === 'admin' ? 'Administrador' : 'Aluno'}
            </p>
          </div>
        </aside>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </main>
      </div>

      <div
        className={clsx(
          'fixed inset-0 z-40 md:hidden transition-opacity duration-200',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-72 bg-white border-r-2 border-black shadow-brutal transition-transform duration-200 md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b-2 border-black">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <img
              src={siteLogo}
              alt="CASEG Protege"
              className="h-20 w-auto object-contain"
            />
          </Link>
          <button
            type="button"
            className="w-10 h-10 border-2 border-black flex items-center justify-center"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <nav className="px-4 py-5 space-y-3">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 font-display font-bold text-sm uppercase tracking-wide border-2 rounded-xl transition-all',
                  isActive
                    ? 'bg-brand text-white border-black shadow-brutal-sm'
                    : 'bg-white text-black border-black hover:bg-gray-50'
                )}
              >
                <link.icon size={18} strokeWidth={2.5} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t-2 border-black">
          <p className="font-display font-bold text-sm uppercase">{user?.name}</p>
          <p className="font-body text-xs text-gray-500 mt-1">
            {user?.role === 'admin' ? 'Administrador' : 'Aluno'}
          </p>
          <Button variant="outline" size="sm" onClick={logout} className="w-full gap-2 justify-center mt-4">
            <LogOut size={16} />
            Sair
          </Button>
        </div>
      </aside>
    </div>
  );
}
