import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Mail, Shield, Code, Flame, BookOpen, ChevronRight } from 'lucide-react';
import { progressApi, analyticsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { SolvedProblem, SheetProgress } from '../../types';
import { Card, StatCard, Badge, ProgressBar, Spinner, Tabs } from '../ui';
import { PageHeader } from '../layout/AppLayout';
import { Avatar } from '../ui';
import { cn, diffBg, fmtDate } from '../../utils';
import { Link } from 'react-router-dom';

export function ProfilePage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('overview');

  const { data: progress, isLoading } = useQuery({
    queryKey: ['userProgress', user?.id],
    queryFn: () => progressApi.getUserProgress(user!.id),
    enabled: !!user,
    select: r => r.data.data,
  });

  const { data: ua } = useQuery({
    queryKey: ['userAnalytics', user?.id],
    queryFn: () => analyticsApi.getUserAnalytics(user!.id),
    enabled: !!user,
    select: r => r.data.data,
  });

  if (!user) return null;

  const solved: SolvedProblem[] = progress?.solvedProblems ?? [];
  const sheetProg: SheetProgress[] = progress?.sheetProgress ?? [];

  return (
    <div className="max-w-3xl anim-up">
      <PageHeader title="Profile" />

      {/* User card */}
      <Card className="p-6 mb-5">
        <div className="flex items-start gap-4">
          <Avatar name={user.name} size={56} />
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-xl text-zinc-100">{user.name}</h2>
            <div className="flex items-center gap-1.5 text-sm text-zinc-500 mt-1">
              <Mail size={13} />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-1">
              <Shield size={11} />
              <span className="capitalize">{user.role}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Flame size={12} className="text-amber-400" />
              <span className="text-xs font-bold font-mono text-amber-400">{ua?.currentStreak ?? 0}d streak</span>
            </div>
            {ua?.longestStreak > 0 && (
              <p className="text-[10px] text-zinc-700">Best: {ua.longestStreak}d</p>
            )}
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 stagger">
        <StatCard label="Solved" value={progress?.totalSolved ?? 0} icon={<Code size={14} />} accent="#22c55e" />
        <StatCard label="Easy" value={progress?.easySolved ?? 0} icon={<Code size={14} />} accent="#22c55e"
          sub={`${progress?.totalSolved ? Math.round((progress.easySolved / progress.totalSolved) * 100) : 0}%`} />
        <StatCard label="Medium" value={progress?.mediumSolved ?? 0} icon={<Code size={14} />} accent="#f59e0b"
          sub={`${progress?.totalSolved ? Math.round((progress.mediumSolved / progress.totalSolved) * 100) : 0}%`} />
        <StatCard label="Hard" value={progress?.hardSolved ?? 0} icon={<Code size={14} />} accent="#ef4444"
          sub={`${progress?.totalSolved ? Math.round((progress.hardSolved / progress.totalSolved) * 100) : 0}%`} />
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={[{ id: 'overview', label: 'Sheet Progress' }, { id: 'solved', label: `Solved (${solved.length})` }]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner size={24} /></div>
      ) : tab === 'overview' ? (
        /* Sheet progress list */
        <div className="space-y-2">
          {sheetProg.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen size={24} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-600">No sheet progress yet.</p>
              <Link to="/sheets" className="text-xs text-green-400 hover:text-green-300 mt-1 inline-block transition-colors">
                Start a sheet →
              </Link>
            </Card>
          ) : sheetProg.map(sp => (
            <Card key={sp.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-zinc-200 truncate flex-1 min-w-0 pr-4">
                  Sheet progress
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-mono text-zinc-500">{sp.solvedCount}/{sp.totalProblems}</span>
                  <span className="text-xs font-mono font-bold text-green-400">{sp.completionPercentage}%</span>
                </div>
              </div>
              <ProgressBar pct={sp.completionPercentage} color={sp.completionPercentage === 100 ? '#22c55e' : '#16a34a'} />
              <p className="text-[10px] text-zinc-700 mt-1.5">Last active: {fmtDate(sp.lastActivityAt)}</p>
            </Card>
          ))}
        </div>
      ) : (
        /* Solved problems list */
        <div className="space-y-1.5">
          {solved.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-zinc-600">No problems solved yet. Start solving!</p>
              <Link to="/sheets" className="text-xs text-green-400 hover:text-green-300 mt-1 inline-block transition-colors">
                Browse sheets →
              </Link>
            </Card>
          ) : [...solved].sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime()).map(s => (
            <Card key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <p className="flex-1 text-sm text-zinc-300 truncate min-w-0 font-mono text-xs">{s.problemId.slice(0, 8)}…</p>
              <Badge variant={s.difficulty}>{s.difficulty}</Badge>
              {s.isRevision && <Badge variant="zinc">revision</Badge>}
              <span className="text-[10px] text-zinc-700 flex-shrink-0">{fmtDate(s.solvedAt)}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
