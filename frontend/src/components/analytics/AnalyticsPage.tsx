import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Flame, Code, ClipboardList, MessageSquare, Trophy, TrendingUp } from 'lucide-react';
import { analyticsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { ActivityByDay, LeaderboardEntry, UserAnalytics } from '../../types';
import { Card, StatCard, Spinner, Badge, Tabs } from '../ui';
import { PageHeader } from '../layout/AppLayout';
import { cn, heatmapColor } from '../../utils';

/* ── Heatmap ──────────────────────────────────────── */
function Heatmap({ data }: { data: ActivityByDay[] }) {
  const today = new Date();
  const DAY_MS = 86400000;
  const WEEKS = 52;
  const DAYS = 7;

  // Build a date→count map
  const countMap: Record<string, number> = {};
  data.forEach(d => { countMap[d.date] = d.solves; });

  // Build grid: 52 weeks × 7 days, going back from today
  const startDate = new Date(today.getTime() - (WEEKS * DAYS - 1) * DAY_MS);
  // Align to Sunday
  const dayOffset = startDate.getDay();
  const gridStart = new Date(startDate.getTime() - dayOffset * DAY_MS);

  const weeks: { date: Date; count: number }[][] = [];
  for (let w = 0; w < WEEKS + 1; w++) {
    const week: { date: Date; count: number }[] = [];
    for (let d = 0; d < DAYS; d++) {
      const date = new Date(gridStart.getTime() + (w * DAYS + d) * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      week.push({ date, count: countMap[key] ?? 0 });
    }
    weeks.push(week);
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Month labels: find week index where month changes
  const monthLabels: { label: string; weekIdx: number }[] = [];
  weeks.forEach((week, wi) => {
    const first = week[0].date;
    if (wi === 0 || first.getMonth() !== weeks[wi - 1][0].date.getMonth()) {
      monthLabels.push({ label: months[first.getMonth()], weekIdx: wi });
    }
  });

  const totalSolves = data.reduce((s, d) => s + d.solves, 0);
  const activeDays = data.filter(d => d.solves > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Activity — Last 12 months</p>
        <div className="flex items-center gap-3 text-xs text-zinc-600">
          <span>{totalSolves} solves</span>
          <span>·</span>
          <span>{activeDays} active days</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: 700 }}>
          {/* Month labels */}
          <div className="flex mb-1 pl-7">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.weekIdx === wi);
              return (
                <div key={wi} style={{ width: 14, marginRight: 2, flexShrink: 0 }}
                  className="text-[9px] text-zinc-600 font-medium">
                  {ml?.label ?? ''}
                </div>
              );
            })}
          </div>

          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1.5" style={{ paddingTop: 0 }}>
              {dayLabels.map((d, i) => (
                <div key={i} style={{ height: 12, lineHeight: '12px' }} className="text-[9px] text-zinc-700 w-4 text-right pr-1">
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {/* Cells */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5 mr-0.5">
                {week.map((cell, di) => {
                  const isFuture = cell.date > today;
                  const title = `${cell.date.toISOString().slice(0, 10)}: ${cell.count} solve${cell.count !== 1 ? 's' : ''}`;
                  return (
                    <div key={di} title={title}
                      style={{ width: 12, height: 12 }}
                      className={cn('rounded-sm transition-colors duration-150',
                        isFuture ? 'bg-[#111116]' : heatmapColor(cell.count)
                      )} />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-2 pl-7">
            <span className="text-[10px] text-zinc-700">Less</span>
            {[0, 1, 2, 4, 7].map(v => (
              <div key={v} style={{ width: 12, height: 12 }} className={cn('rounded-sm', heatmapColor(v))} />
            ))}
            <span className="text-[10px] text-zinc-700">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Difficulty ring ──────────────────────────────── */
function DiffRing({ easy, medium, hard, total }: { easy: number; medium: number; hard: number; total: number }) {
  if (total === 0) return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="w-28 h-28 rounded-full border-4 border-[#2a2a30] flex items-center justify-center">
        <span className="text-zinc-700 text-xs">No data</span>
      </div>
    </div>
  );

  const r = 40;
  const circ = 2 * Math.PI * r;
  const eArc = (easy / total) * circ;
  const mArc = (medium / total) * circ;
  const hArc = (hard / total) * circ;
  const gap = 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={120} height={120} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#1e1e26" strokeWidth="10" />
          {/* Easy */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="#22c55e" strokeWidth="9"
            strokeDasharray={`${eArc - gap} ${circ - eArc + gap}`}
            strokeDashoffset={circ / 4} strokeLinecap="round" />
          {/* Medium */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f59e0b" strokeWidth="9"
            strokeDasharray={`${mArc - gap} ${circ - mArc + gap}`}
            strokeDashoffset={circ / 4 - eArc} strokeLinecap="round" />
          {/* Hard */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="#ef4444" strokeWidth="9"
            strokeDasharray={`${hArc - gap} ${circ - hArc + gap}`}
            strokeDashoffset={circ / 4 - eArc - mArc} strokeLinecap="round" />
          <text x="50" y="46" textAnchor="middle" className="font-display" fontSize="14" fontWeight="700" fill="#e8e8ea">{total}</text>
          <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#71717a">solved</text>
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-2">
        {[{ label: 'Easy', count: easy, color: '#22c55e' }, { label: 'Med', count: medium, color: '#f59e0b' }, { label: 'Hard', count: hard, color: '#ef4444' }].map(d => (
          <div key={d.label} className="text-center">
            <p className="text-sm font-bold font-mono" style={{ color: d.color }}>{d.count}</p>
            <p className="text-[10px] text-zinc-600">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Analytics page ───────────────────────────────── */
export function AnalyticsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [lbTab, setLbTab] = useState('overall');

  const { data: ua, isLoading: uaLoading } = useQuery({
    queryKey: ['userAnalytics', user?.id],
    queryFn: () => analyticsApi.getUserAnalytics(user!.id),
    enabled: !!user,
    select: r => r.data.data as UserAnalytics,
  });

  const { data: heatmap } = useQuery({
    queryKey: ['heatmap', user?.id],
    queryFn: () => analyticsApi.getUserHeatmap(user!.id),
    enabled: !!user,
    select: r => (r.data.data?.activityByDay ?? r.data.data) as ActivityByDay[],
  });

  const { data: leaderboard, isLoading: lbLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => analyticsApi.getLeaderboard(),
    select: r => r.data.data as LeaderboardEntry[],
  });

  const { data: platform } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
    select: r => r.data.data,
  });

  if (!isAuthenticated) {
    return (
      <div className="anim-up">
        <PageHeader title="Analytics" subtitle="Sign in to view your personal analytics" />
        <Card className="p-8 text-center">
          <BarChart2 size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Sign in to see your progress analytics, activity heatmap, and ranking</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 anim-up">
      <PageHeader title="Analytics" subtitle="Your detailed preparation metrics and platform rankings" />

      {uaLoading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : (
        <>
          {/* Personal stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <StatCard label="Total Solved" value={ua?.totalSolved ?? 0} icon={<Code size={15} />} accent="#22c55e" />
            <StatCard label="Current Streak" value={`${ua?.currentStreak ?? 0}d`} sub={`Best: ${ua?.longestStreak ?? 0}d`} icon={<Flame size={15} />} accent="#f59e0b" />
            <StatCard label="Mock Tests" value={ua?.mockAttempts ?? 0} sub={`Avg: ${Math.round(ua?.averageMockScore ?? 0)}%`} icon={<ClipboardList size={15} />} accent="#a855f7" />
            <StatCard label="Interview Posts" value={ua?.interviewPosts ?? 0} icon={<MessageSquare size={15} />} accent="#38bdf8" />
          </div>

          {/* Heatmap + ring */}
          <div className="grid lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 p-5">
              {heatmap ? <Heatmap data={heatmap} /> : (
                <div className="flex items-center justify-center h-32 text-zinc-700 text-sm">No activity data yet</div>
              )}
            </Card>

            <Card className="p-5 flex flex-col items-center justify-center">
              <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-4">Problems by Difficulty</p>
              <DiffRing
                easy={ua?.easySolved ?? 0}
                medium={ua?.mediumSolved ?? 0}
                hard={ua?.hardSolved ?? 0}
                total={ua?.totalSolved ?? 0}
              />
            </Card>
          </div>

          {/* Platform stats + Leaderboard */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Platform numbers */}
            <Card className="p-5 space-y-4">
              <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest">Platform Stats</p>
              {[
                { label: 'Total Users', value: platform?.totalUsers, color: '#22c55e' },
                { label: 'Total Problems', value: platform?.totalProblems, color: '#f59e0b' },
                { label: 'Total Sheets', value: platform?.totalSheets, color: '#38bdf8' },
                { label: 'Total Solves', value: platform?.totalSolves, color: '#22c55e' },
                { label: 'Mock Attempts', value: platform?.totalMockAttempts, color: '#a855f7' },
                { label: 'Interview Posts', value: platform?.totalInterviewPosts, color: '#f472b6' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span className="text-sm font-bold font-mono" style={{ color }}>{value?.toLocaleString() ?? '—'}</span>
                </div>
              ))}
            </Card>

            {/* Leaderboard */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest">Leaderboard</p>
                <TrendingUp size={14} className="text-zinc-700" />
              </div>
              <Card>
                {lbLoading ? (
                  <div className="flex justify-center py-8"><Spinner size={20} /></div>
                ) : (
                  <>
                    {/* Header row */}
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1e1e24]">
                      <span className="w-8 text-[10px] text-zinc-700 text-center">#</span>
                      <span className="flex-1 text-[10px] text-zinc-700 uppercase tracking-wider">User</span>
                      <span className="text-[10px] text-zinc-700 uppercase tracking-wider w-16 text-right">Streak</span>
                      <span className="text-[10px] text-zinc-700 uppercase tracking-wider w-16 text-right">Solved</span>
                    </div>
                    {leaderboard?.slice(0, 12).map((entry, i) => {
                      const isMe = entry.userId === user?.id;
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                      return (
                        <div key={entry.userId ?? i}
                          className={cn('flex items-center gap-3 px-4 py-2.5 border-b border-[#181820] last:border-0 transition-colors',
                            isMe ? 'bg-green-500/5' : 'hover:bg-[#161619]')}>
                          <span className="w-8 text-center text-xs font-mono font-semibold flex-shrink-0" style={{ color: i < 3 ? ['#f59e0b', '#94a3b8', '#b45309'][i] : '#3f3f46' }}>
                            {medal ?? i + 1}
                          </span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[10px] font-bold text-green-400 font-mono flex-shrink-0">
                              {(entry.name ?? '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={cn('text-xs font-medium truncate', isMe ? 'text-green-400' : 'text-zinc-300')}>
                                {entry.name ?? `User ${i + 1}`}{isMe && ' (you)'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-amber-500 w-16 text-right flex-shrink-0">
                            {entry.currentStreak > 0 ? `🔥${entry.currentStreak}d` : '—'}
                          </span>
                          <span className="text-xs font-mono font-bold text-green-400 w-16 text-right flex-shrink-0">
                            {entry.totalSolved}
                          </span>
                        </div>
                      );
                    })}
                    {!leaderboard?.length && (
                      <div className="py-8 text-center text-zinc-700 text-sm">No rankings yet</div>
                    )}
                  </>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
