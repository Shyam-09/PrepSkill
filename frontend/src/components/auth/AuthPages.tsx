import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Zap, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../ui';

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      {/* Grid bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#1c1c22 1px,transparent 1px),linear-gradient(90deg,#1c1c22 1px,transparent 1px)', backgroundSize: '48px 48px', opacity: .4 }} />
      {/* Green glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(34,197,94,.07) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-[380px] anim-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/25 mb-3">
            <Zap size={22} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-zinc-100">PrepSkill</span>
          <p className="text-xs text-zinc-600 mt-1">Master DSA. Ace interviews.</p>
        </div>

        <div className="bg-[#0e0e11] border border-[#2a2a30] rounded-2xl p-6 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      const { accessToken, refreshToken, user } = data.data;
      setAuth(user, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell>
      <h2 className="font-display font-bold text-lg text-zinc-100 mb-0.5">Welcome back</h2>
      <p className="text-xs text-zinc-500 mb-5">Sign in to continue your prep</p>

      {params.get('registered') && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
          Account created! Sign in below.
        </div>
      )}

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email" type="email" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)}
          icon={<Mail size={14} />} required
        />
        <Input
          label="Password" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
          value={password} onChange={e => setPassword(e.target.value)}
          icon={<Lock size={14} />}
          suffix={
            <button type="button" onClick={() => setShowPwd(s => !s)} className="hover:text-zinc-300 transition-colors">
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
          required
        />
        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
          Sign in
        </Button>
      </form>

      <p className="text-center text-xs text-zinc-600 mt-5">
        No account?{' '}
        <Link to="/register" className="text-green-400 hover:text-green-300 font-medium transition-colors">Create one</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await authApi.register(form);
      navigate('/login?registered=1');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell>
      <h2 className="font-display font-bold text-lg text-zinc-100 mb-0.5">Create account</h2>
      <p className="text-xs text-zinc-500 mb-5">Start your interview prep journey</p>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" placeholder="Jane Doe" value={form.name} onChange={set('name')} icon={<User size={14} />} required />
        <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} icon={<Mail size={14} />} required />
        <Input
          label="Password" type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters"
          value={form.password} onChange={set('password')} icon={<Lock size={14} />}
          suffix={
            <button type="button" onClick={() => setShowPwd(s => !s)} className="hover:text-zinc-300 transition-colors">
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
          hint="Must be at least 6 characters"
          required
        />
        <Button type="submit" loading={loading} fullWidth size="lg">
          Create account
        </Button>
      </form>

      <p className="text-center text-xs text-zinc-600 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">Sign in</Link>
      </p>
    </AuthShell>
  );
}
