import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Zap, LayoutDashboard, BookOpen, ClipboardList,
  MessageSquare, BarChart2, LogOut, Menu, X,
  ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';
import { cn } from '../../utils';
import { Avatar } from '../ui';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sheets',    icon: BookOpen,        label: 'Sheets' },
  { to: '/mock',      icon: ClipboardList,   label: 'Mock Tests' },
  { to: '/interviews',icon: MessageSquare,   label: 'Interviews' },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
  };

  const SidebarContent = ({ close }: { close?: () => void }) => (
    <>
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 h-14 border-b border-[#1e1e24] flex-shrink-0', collapsed && !close && 'justify-center')}>
        <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
          <Zap size={14} className="text-white" />
        </div>
        {(!collapsed || close) && (
          <span className="font-display font-bold text-[15px] text-zinc-100 tracking-tight">PrepSkill</span>
        )}
        {close && (
          <button onClick={close} className="ml-auto text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-[#1f1f26] transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => close?.()}
            className={({ isActive }) => cn(
              'flex items-center rounded-xl text-sm font-medium transition-all duration-150',
              collapsed && !close ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2',
              isActive
                ? 'bg-green-500/10 text-green-400'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#1e1e26]'
            )}>
            <Icon size={16} className="flex-shrink-0" />
            {(!collapsed || close) && label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('px-2 py-3 border-t border-[#1e1e24] space-y-0.5 flex-shrink-0')}>
        {user && (
          <NavLink to="/profile" onClick={() => close?.()}
            className={cn('flex items-center rounded-xl transition-all duration-150 text-zinc-500 hover:text-zinc-200 hover:bg-[#1e1e26]',
              collapsed && !close ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2')}>
            <Avatar name={user.name} size={24} />
            {(!collapsed || close) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-300 truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-600 truncate capitalize">{user.role}</p>
              </div>
            )}
          </NavLink>
        )}
        <button onClick={handleLogout}
          className={cn('flex items-center rounded-xl transition-all duration-150 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 w-full',
            collapsed && !close ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2')}>
          <LogOut size={15} className="flex-shrink-0" />
          {(!collapsed || close) && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col flex-shrink-0 relative transition-all duration-300',
        'border-r border-[#1e1e24]',
        collapsed ? 'w-16' : 'w-56'
      )} style={{ background: '#0e0e11' }}>
        <SidebarContent />
        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#26262e] border border-[#3a3a42] flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-[#303038] transition-all z-10">
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Mobile sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 bottom-0 z-50 w-56 flex flex-col transition-transform duration-300 lg:hidden border-r border-[#1e1e24]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )} style={{ background: '#0e0e11' }}>
        <SidebarContent close={() => setMobileOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 border-b border-[#1e1e24] flex-shrink-0" style={{ background: '#0e0e11' }}>
          <button onClick={() => setMobileOpen(true)} className="text-zinc-500 hover:text-zinc-300 p-1">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-green-500 flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="font-display font-bold text-sm">PrepSkill</span>
          </div>
          {user ? <Avatar name={user.name} size={28} /> : <div className="w-7 h-7" />}
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Page header ─────────────────────────────────── */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-zinc-100">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Back link ───────────────────────────────────── */
export function BackLink({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(to)}
      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-5 group">
      <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  );
}
