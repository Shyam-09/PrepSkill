import React, { useState, useEffect, useRef } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '../../utils';

/* ── Spinner ─────────────────────────────────────── */
export function Spinner({ size = 18, color = '#22c55e' }: { size?: number; color?: string }) {
  return <Loader2 size={size} style={{ color }} className="animate-spin" />;
}

/* ── Button ──────────────────────────────────────── */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type BtnSize    = 'xs' | 'sm' | 'md' | 'lg';

const btnVariants: Record<BtnVariant, string> = {
  primary:   'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20',
  secondary: 'bg-[#26262c] hover:bg-[#2e2e35] text-zinc-200 border border-[#33333a]',
  ghost:     'text-zinc-400 hover:text-zinc-100 hover:bg-[#1f1f26]',
  danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  outline:   'border border-[#33333a] hover:border-[#555560] text-zinc-300 hover:text-zinc-100',
};
const btnSizes: Record<BtnSize, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-md gap-1',
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
};

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: BtnSize; loading?: boolean; fullWidth?: boolean;
}
export function Button({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        btnVariants[variant], btnSizes[size], fullWidth && 'w-full', className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner size={14} color="currentColor" />}
      {children}
    </button>
  );
}

/* ── Input ───────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string; icon?: React.ReactNode; suffix?: React.ReactNode;
}
export function Input({ label, error, hint, icon, suffix, className, id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-xs font-medium text-zinc-400">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">{icon}</span>}
        <input
          id={inputId}
          className={cn(
            'w-full bg-[#1c1c22] border text-zinc-100 text-sm placeholder-zinc-600 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-600/60',
            'transition-all duration-150',
            icon ? 'pl-9' : 'pl-3',
            suffix ? 'pr-10' : 'pr-3',
            'py-2.5',
            error ? 'border-red-500/50' : 'border-[#2e2e35] hover:border-[#3e3e46]',
            className
          )}
          {...rest}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

/* ── Textarea ────────────────────────────────────── */
interface AreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string;
}
export function Textarea({ label, error, className, ...rest }: AreaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-zinc-400">{label}</label>}
      <textarea className={cn(
        'w-full bg-[#1c1c22] border border-[#2e2e35] hover:border-[#3e3e46] text-zinc-100 text-sm placeholder-zinc-600',
        'rounded-lg px-3 py-2.5 resize-none',
        'focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-600/60 transition-all duration-150',
        error && 'border-red-500/50', className
      )} {...rest} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* ── Select ──────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; options: { value: string; label: string }[];
}
export function Select({ label, options, className, ...rest }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-zinc-400">{label}</label>}
      <select className={cn(
        'w-full bg-[#1c1c22] border border-[#2e2e35] hover:border-[#3e3e46] text-zinc-100 text-sm',
        'rounded-lg px-3 py-2.5 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-600/60 transition-all duration-150',
        className
      )} {...rest}>
        {options.map(o => <option key={o.value} value={o.value} className="bg-[#1c1c22]">{o.label}</option>)}
      </select>
    </div>
  );
}

/* ── Badge ───────────────────────────────────────── */
type BadgeVariant = 'easy' | 'medium' | 'hard' | 'mixed' | 'beginner' | 'intermediate' | 'advanced' | 'green' | 'amber' | 'red' | 'zinc' | 'purple';
const badgeMap: Record<BadgeVariant, string> = {
  easy:         'bg-green-500/10 text-green-400',
  beginner:     'bg-green-500/10 text-green-400',
  green:        'bg-green-500/10 text-green-400',
  medium:       'bg-amber-500/10 text-amber-400',
  intermediate: 'bg-amber-500/10 text-amber-400',
  amber:        'bg-amber-500/10 text-amber-400',
  hard:         'bg-red-500/10 text-red-400',
  advanced:     'bg-red-500/10 text-red-400',
  red:          'bg-red-500/10 text-red-400',
  mixed:        'bg-purple-500/10 text-purple-400',
  purple:       'bg-purple-500/10 text-purple-400',
  zinc:         'bg-zinc-700/50 text-zinc-400',
};
export function Badge({ variant = 'zinc', children, className }: { variant?: BadgeVariant; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium', badgeMap[variant], className)}>{children}</span>;
}

/* ── Card ────────────────────────────────────────── */
export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={cn('bg-[#131316] border border-[#2a2a30] rounded-xl', onClick && 'cursor-pointer hover:border-[#3a3a42] transition-all duration-150', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/* ── Progress bar ────────────────────────────────── */
export function ProgressBar({ pct, color = '#22c55e', thin = false, className }: { pct: number; color?: string; thin?: boolean; className?: string }) {
  return (
    <div className={cn('w-full bg-[#23232a] rounded-full overflow-hidden', thin ? 'h-1' : 'h-1.5', className)}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

/* ── Avatar ──────────────────────────────────────── */
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const ini = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.35, flexShrink: 0 }}
      className="rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center font-semibold text-green-400 font-mono">
      {ini}
    </div>
  );
}

/* ── Stat card ───────────────────────────────────── */
export function StatCard({ label, value, icon, sub, accent = '#22c55e' }: { label: string; value: string | number; icon: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{label}</p>
        <div className="p-2 rounded-lg" style={{ background: `${accent}15`, color: accent }}>{icon}</div>
      </div>
      <p className="text-2xl font-bold font-display" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </Card>
  );
}

/* ── Empty state ─────────────────────────────────── */
export function Empty({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div className="p-4 rounded-2xl bg-[#1f1f26] text-zinc-600">{icon}</div>
      <p className="text-base font-semibold text-zinc-300">{title}</p>
      {description && <p className="text-sm text-zinc-600 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

/* ── Modal ───────────────────────────────────────── */
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-[#131316] border border-[#2a2a30] rounded-2xl w-full shadow-2xl anim-up max-h-[90vh] overflow-y-auto', maxWidth)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a30]">
          <h2 className="text-sm font-semibold text-zinc-100 font-display">{title}</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-[#1f1f26]">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Tabs ────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-[#1a1a20] border border-[#2a2a30] rounded-xl w-fit">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={cn('px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
            active === t.id ? 'bg-[#26262e] text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300')}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── Tooltip ─────────────────────────────────────── */
export function Tooltip({ children, tip }: { children: React.ReactNode; tip: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#26262e] border border-[#3a3a42] rounded-md text-xs text-zinc-300 whitespace-nowrap z-50 pointer-events-none">
          {tip}
        </div>
      )}
    </div>
  );
}
