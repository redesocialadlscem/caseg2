import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Award, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  Video,
  Newspaper
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { Button } from '../Button';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Cursos', path: '/admin/courses', icon: BookOpen },
  { label: 'Usuários', path: '/admin/users', icon: Users },
  { label: 'Certificados', path: '/admin/certificates', icon: Award },
  { label: 'Notícias', path: '/admin/news', icon: Newspaper },
  { label: 'Portal Corporativo', path: '/admin/live-sessions', icon: Video },
  { label: 'Configurações', path: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { siteLogo } = useSiteSettings();

  const handleLogout = () => {
    // TODO: implementar logout real via AuthContext quando integrar
    window.location.href = '/';
  };

  const NavLink = ({ item }: { item: typeof navItems[number] }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={twMerge(
          clsx(
            'flex items-center gap-3 px-4 py-3 font-display font-bold text-sm uppercase tracking-wide border-2 transition-all',
            isActive
              ? 'bg-brand text-white border-black shadow-brutal-sm'
              : 'bg-white text-black border-transparent hover:bg-gray-50 hover:border-black'
          )
        )}
      >
        <item.icon size={20} strokeWidth={2.5} />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white border-2 border-black p-2 shadow-brutal brutal-interactive"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={twMerge(
          clsx(
            'fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r-2 border-black flex flex-col transition-transform duration-300 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b-2 border-black">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={siteLogo}
              alt="CASEG Protege"
              className="h-40 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t-2 border-black">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Sair do Painel
          </Button>
        </div>
      </aside>
    </>
  );
}
