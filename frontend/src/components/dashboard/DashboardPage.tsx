import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Code, Flame, ClipboardList, MessageSquare,
  Users, BookOpen, Trophy, ArrowRight, TrendingUp, Star
} from 'lucide-react';
import { analyticsApi, progressApi, contentApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { StatCard, Card, ProgressBar, Spinner, Badge } from '../ui';
import { PageHeader } from '../layout/AppLayout';
import { Sheet, SheetProgress } from '../../types';
import { sheetDiffBg } from '../../utils';

export function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();

  const { data: platform, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
    select: r => r.data.data,
  });

  const { data: ua } = useQuery({
    queryKey: ['userAnalytics', user?.id],
    queryFn: () => analyticsApi.getUserAnalytics(user!.id),
    enabled: !!user,
    select: r => r.data.data,
  });

  const { data: progress } = useQuery({
    queryKey: ['userProgress', user?.id],
    queryFn: () => progressApi.getUserProgress(user!.id),
    enabled: !!user,
    select: r => r.data.data,
  });

  const { data: sheets } = useQuery({
    queryKey: ['sheets'],
    queryFn: () => contentApi.getSheets(),
    select: r => r.data.data as Sheet[],
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => analyticsApi.getLeaderboard(),
    select: r => r.data.data as any[],
  });

  const progressMap: Record<string, SheetProgress> = {};
  progress?.sheetProgress?.forEach((sp: SheetProgress) => { progressMap[sp.sheetId] = sp; });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={28} />
    </div>
  );

  const p = platform ?? {};
  const u = ua ?? {};

  return (
    <div className="space-y-8 anim-up">
      <PageHeader
        title={user ? `Hey, ${user.name.split(' ')[0]} 👋` : 'Dashboard'}
        subtitle="Track your progress and keep the streak alive"
      />

      {/* Personal stats */}
      {isAuthenticated && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard label="Problems Solved" value={u.totalSolved ?? 0}
            sub={`E:${u.easySolved ?? 0}  M:${u.mediumSolved ?? 0}  H:${u.hardSolved ?? 0}`}
            icon={<Code size={15} />} accent="#22c55e" />
          <StatCard label="Current Streak" value={`${u.currentStreak ?? 0}d`}
            sub={`Best: ${u.longestStreak ?? 0} days`}
            icon={<Flame size={15} />} accent="#f59e0b" />
          <StatCard label="Mock Tests" value={u.mockAttempts ?? 0}
            sub={`Avg score: ${Math.round(u.averageMockScore ?? 0)}%`}
            icon={<ClipboardList size={15} />} accent="#a855f7" />
          <StatCard label="Interviews Shared" value={u.interviewPosts ?? 0}
            icon={<MessageSquare size={15} />} accent="#38bdf8" />
        </div>
      )}

      {/* Platform stats banner */}
      <Card className="p-5">
        <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-4">Platform Overview</p>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Users',    value: p.totalUsers,          icon: <Users size={14} />,         color: '#22c55e' },
            { label: 'Problems', value: p.totalProblems,        icon: <Code size={14} />,          color: '#f59e0b' },
            { label: 'Sheets',   value: p.totalSheets,          icon: <BookOpen size={14} />,      color: '#38bdf8' },
            { label: 'Solves',   value: p.totalSolves,          icon: <Trophy size={14} />,        color: '#22c55e' },
            { label: 'Mocks',    value: p.totalMockAttempts,    icon: <ClipboardList size={14} />, color: '#a855f7' },
            { label: 'Interviews', value: p.totalInterviewPosts, icon: <MessageSquare size={14} />, color: '#f472b6' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="text-center">
              <div className="flex justify-center mb-1.5" style={{ color }}>{icon}</div>
              <p className="font-display font-bold text-xl text-zinc-100">{value?.toLocaleString() ?? '—'}</p>
              <p className="text-[11px] text-zinc-600">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent sheets */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-zinc-200">Problem Sheets</h2>
            <Link to="/sheets" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {sheets?.slice(0, 6).map(sheet => {
              const sp = progressMap[sheet.id];
              const pct = sp?.completionPercentage ?? 0;
              return (
                <Link key={sheet.id} to={`/sheets/${sheet.id}`}>
                  <Card className="p-4 hover:border-[#3a3a42] group transition-all duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 group-hover:text-green-400 transition-colors truncate">
                          {sheet.title}
                        </p>
                        <Badge variant={sheet.difficulty}>{sheet.difficulty}</Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-zinc-600">{sheet.totalProblems}q</span>
                        {pct > 0 && <span className="text-xs font-mono text-green-500">{pct}%</span>}
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={pct === 100 ? '#22c55e' : '#16a34a'} thin />
                  </Card>
                </Link>
              );
            })}
            {!sheets?.length && (
              <Card className="p-8 text-center text-zinc-600 text-sm">No sheets yet</Card>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-zinc-200">Top Solvers</h2>
            <TrendingUp size={14} className="text-zinc-600" />
          </div>
          <Card>
            {leaderboard?.slice(0, 10).map((entry: any, i: number) => {
              const medal = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : undefined;
              return (
                <div key={entry.userId ?? i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1e1e24] last:border-0">
                  <span className="w-5 text-center text-xs font-mono font-bold flex-shrink-0"
                    style={{ color: medal ?? '#3f3f46' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xs font-bold text-green-400 font-mono flex-shrink-0">
                    {entry.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-300 truncate">{entry.name ?? `User ${i + 1}`}</p>
                    {entry.currentStreak > 0 && (
                      <p className="text-[10px] text-amber-500">🔥 {entry.currentStreak}d</p>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-green-400 flex-shrink-0">{entry.totalSolved}</span>
                </div>
              );
            })}
            {!leaderboard?.length && (
              <div className="py-8 text-center text-zinc-600 text-sm">No data yet</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
