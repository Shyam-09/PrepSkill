import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, BookOpen, ClipboardList, MessageSquare, BarChart2, ArrowRight, Check } from 'lucide-react';

const FEATURES = [
  { icon: BookOpen, title: 'Curated Problem Sheets', desc: 'DSA sheets organized by topic and difficulty — from beginner to advanced.' },
  { icon: ClipboardList, title: 'Timed Mock Tests', desc: 'MCQ tests with auto-grading, leaderboards, and detailed answer review.' },
  { icon: MessageSquare, title: 'Interview Experiences', desc: 'Real stories from engineers who got hired. Learn what to expect.' },
  { icon: BarChart2, title: 'Progress Analytics', desc: 'Track streaks, difficulty breakdown, heatmaps, and your rank.' },
];

const STATS = [
  { value: '10k+', label: 'Problems' },
  { value: '50+', label: 'Sheets' },
  { value: '5k+', label: 'Users' },
  { value: '500+', label: 'Interviews' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#1c1c22 1px,transparent 1px),linear-gradient(90deg,#1c1c22 1px,transparent 1px)', backgroundSize: '48px 48px', opacity: .35 }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(34,197,94,.09) 0%, transparent 65%)' }} />

      {/* Nav */}
      <nav className="relative flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/25">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-zinc-100">PrepSkill</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1f1f26]">
            Sign in
          </Link>
          <Link to="/register"
            className="text-sm font-medium bg-green-500 hover:bg-green-400 text-white px-4 py-1.5 rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-4xl mx-auto px-6 pt-20 pb-24 text-center anim-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Built for serious interview prep
        </div>

        <h1 className="font-display font-bold text-5xl sm:text-6xl text-zinc-100 leading-tight tracking-tight mb-5">
          Master DSA.<br />
          <span className="text-green-400">Ace your interviews.</span>
        </h1>

        <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-10">
          Structured problem sheets, timed mock tests, real interview experiences
          and progress analytics — everything you need to land your dream role.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm shadow-xl shadow-green-500/25 transition-all active:scale-95">
            Start for free <ArrowRight size={16} />
          </Link>
          <Link to="/sheets"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#2a2a30] hover:border-[#3a3a42] text-zinc-300 font-medium text-sm transition-all">
            Browse sheets
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-16 pt-8 border-t border-[#1e1e24]">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display font-bold text-2xl text-green-400">{value}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-5xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 gap-4 stagger">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-5 rounded-2xl border border-[#2a2a30] bg-[#0e0e11] hover:border-[#3a3a42] transition-all group">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4 group-hover:bg-green-500/15 transition-colors">
                <Icon size={18} className="text-green-400" />
              </div>
              <h3 className="font-display font-semibold text-zinc-100 mb-1.5">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-2xl mx-auto px-6 pb-24 text-center">
        <div className="p-8 rounded-2xl border border-green-500/20 bg-green-500/5">
          <h2 className="font-display font-bold text-2xl text-zinc-100 mb-2">Ready to start?</h2>
          <p className="text-sm text-zinc-500 mb-6">Join thousands of engineers preparing for top tech interviews.</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm shadow-xl shadow-green-500/25 transition-all active:scale-95">
            Create free account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[#1e1e24] py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center">
            <Zap size={10} className="text-white" />
          </div>
          <span className="font-display font-bold text-sm text-zinc-400">PrepSkill</span>
        </div>
        <p className="text-xs text-zinc-700">Master DSA. Ace interviews. Get hired.</p>
      </footer>
    </div>
  );
}
