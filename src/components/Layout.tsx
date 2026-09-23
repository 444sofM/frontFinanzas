import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ArrowDownCircle, Target, Settings,
  LogOut, Menu, X, TrendingUp, PieChart, Wallet, Tag, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { path: '/transacciones',label: 'Transacciones',  icon: ArrowDownCircle },
  { path: '/reportes',     label: 'Reportes',       icon: PieChart },
  { path: '/metas',        label: 'Metas',          icon: Target },
  { path: '/presupuestos', label: 'Presupuestos',   icon: Wallet },
  { path: '/categorias',   label: 'Categorías',     icon: Tag },
  { path: '/perfil',       label: 'Mi Perfil',      icon: Settings },
];

const AVATAR_GRADIENTS: Record<string, string> = {
  default: 'from-violet-600 to-indigo-600',
  blue:    'from-blue-500 to-cyan-500',
  green:   'from-emerald-500 to-teal-500',
  purple:  'from-purple-600 to-fuchsia-600',
  orange:  'from-orange-500 to-amber-500',
  pink:    'from-pink-500 to-rose-500',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const gradient = AVATAR_GRADIENTS[user?.avatar || 'default'] || AVATAR_GRADIENTS.default;
  const initials = user?.nombre?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
        bg-[#080b14]/95 backdrop-blur-2xl border-r border-white/[0.06]
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">FinanzApp</span>
            <p className="text-[10px] text-slate-500 -mt-0.5 font-medium uppercase tracking-widest">Personal</p>
          </div>
          <button
            className="ml-auto lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <Link to="/perfil" onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all group">
            <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">{user?.nombre}</p>
              <p className="text-slate-500 text-xs truncate">{user?.moneda} • {user?.email?.split('@')[0]}</p>
            </div>
            <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={active ? 'nav-item-active' : 'nav-item'}
              >
                <Icon size={17} className="flex-shrink-0" />
                <span>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                       text-slate-500 hover:bg-red-500/10 hover:text-red-400
                       transition-all duration-200 w-full"
          >
            <LogOut size={17} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#080b14]/90 backdrop-blur-xl border-b border-white/[0.06]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">FinanzApp</span>
          </div>
          <div className="ml-auto">
            <div className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
