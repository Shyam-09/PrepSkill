import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Search, Lock, ChevronDown, Check,
  Code, FileText, Play, CheckCircle2
} from 'lucide-react';
import { contentApi, progressApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Sheet, Topic, Problem, SolvedProblem, Category } from '../../types';
import { Card, Badge, ProgressBar, Spinner, Empty, Input, Select } from '../ui';
import { PageHeader, BackLink } from '../layout/AppLayout';
import { cn, diffBg, sheetDiffBg } from '../../utils';

/* ── Sheets listing ───────────────────────────────── */
export function SheetsPage() {
  const [search, setSearch] = useState('');
  const [catId, setCatId] = useState('');
  const [diff, setDiff] = useState('');

  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: () => contentApi.getCategories(), select: r => r.data.data as Category[] });
  const { data: sheets, isLoading } = useQuery({
    queryKey: ['sheets', catId, diff],
    queryFn: () => contentApi.getSheets({ categoryId: catId || undefined, difficulty: diff || undefined }),
    select: r => r.data.data as Sheet[],
  });

  const filtered = sheets?.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase())) ?? [];

  const catOptions = [{ value: '', label: 'All Categories' }, ...(cats?.map(c => ({ value: c.id, label: c.name })) ?? [])];
  const diffOptions = [{ value: '', label: 'All Levels' }, { value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }];

  return (
    <div className="anim-up">
      <PageHeader title="Problem Sheets" subtitle="Structured DSA prep sheets to guide your journey" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-48">
          <Input placeholder="Search sheets…" value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} />
        </div>
        <div className="w-44"><Select value={catId} onChange={e => setCatId(e.target.value)} options={catOptions} /></div>
        <div className="w-40"><Select value={diff} onChange={e => setDiff(e.target.value)} options={diffOptions} /></div>
      </div>

      {/* Category chips */}
      {cats && (
        <div className="flex gap-2 flex-wrap mb-5">
          {[{ id: '', name: 'All' }, ...cats].map(c => (
            <button key={c.id} onClick={() => setCatId(c.id)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                catId === c.id
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'border-[#2a2a30] text-zinc-500 hover:border-[#3a3a42] hover:text-zinc-300')}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <Empty icon={<BookOpen size={24} />} title="No sheets found" description="Try adjusting your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map(sheet => (
            <Link key={sheet.id} to={`/sheets/${sheet.id}`}>
              <Card className="p-5 flex flex-col h-full hover:border-[#3a3a42] group transition-all duration-150">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-[#1c1c22] group-hover:bg-green-500/10 transition-colors border border-[#2a2a30] group-hover:border-green-500/20">
                    <BookOpen size={16} className="text-zinc-500 group-hover:text-green-400 transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sheet.isPremium && <span title="Premium"><Lock size={12} className="text-amber-500" /></span>}
                    <Badge variant={sheet.difficulty}>{sheet.difficulty}</Badge>
                  </div>
                </div>

                <h3 className="font-display font-semibold text-zinc-100 group-hover:text-green-400 transition-colors leading-snug mb-1">
                  {sheet.title}
                </h3>
                {sheet.description && (
                  <p className="text-xs text-zinc-600 line-clamp-2 flex-1 mb-3">{sheet.description}</p>
                )}

                <div className="mt-auto pt-3 border-t border-[#1e1e24] flex items-center justify-between">
                  <span className="text-xs text-zinc-600 font-mono">{sheet.totalProblems} problems</span>
                  <span className="text-xs text-zinc-600 group-hover:text-green-500 transition-colors">View →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sheet detail ─────────────────────────────────── */
export function SheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);

  const { data: sheet, isLoading: sLoading } = useQuery({
    queryKey: ['sheet', id], queryFn: () => contentApi.getSheetById(id!), select: r => r.data.data as Sheet, enabled: !!id,
  });
  const { data: topics, isLoading: tLoading } = useQuery({
    queryKey: ['topics', id], queryFn: () => contentApi.getTopicsBySheet(id!), select: r => r.data.data as Topic[], enabled: !!id,
  });
  const { data: problems } = useQuery({
    queryKey: ['problems', id], queryFn: () => contentApi.getProblems({ sheetId: id }), select: r => r.data.data as Problem[], enabled: !!id,
  });
  const { data: progress } = useQuery({
    queryKey: ['userProgress', user?.id], queryFn: () => progressApi.getUserProgress(user!.id),
    enabled: !!user, select: r => r.data.data,
  });

  const solved = new Set(progress?.solvedProblems?.map((s: SolvedProblem) => s.problemId) ?? []);

  const markMut = useMutation({
    mutationFn: (p: Problem) => progressApi.markSolved({ problemId: p.id, sheetId: p.sheetId, topicId: p.topicId, difficulty: p.difficulty }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['userProgress', user?.id] }); setPending(null); },
    onError: () => setPending(null),
  });
  const unmarkMut = useMutation({
    mutationFn: (pid: string) => progressApi.unmarkSolved(pid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['userProgress', user?.id] }),
  });

  const toggle = (problem: Problem) => {
    if (!isAuthenticated) return;
    if (solved.has(problem.id)) { unmarkMut.mutate(problem.id); }
    else { setPending(problem.id); markMut.mutate(problem); }
  };

  const byTopic: Record<string, Problem[]> = {};
  problems?.forEach(p => { (byTopic[p.topicId] ??= []).push(p); });

  const totalSolved = problems?.filter(p => solved.has(p.id)).length ?? 0;
  const total = sheet?.totalProblems ?? 0;
  const pct = total > 0 ? Math.round((totalSolved / total) * 100) : 0;

  if (sLoading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!sheet) return <div className="py-20 text-center text-zinc-500">Sheet not found</div>;

  return (
    <div className="anim-up">
      <BackLink to="/sheets" label="Back to sheets" />

      {/* Sheet header */}
      <Card className="p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={sheet.difficulty}>{sheet.difficulty}</Badge>
              {sheet.isPremium && <Badge variant="amber"><Lock size={10} /> Premium</Badge>}
            </div>
            <h1 className="font-display font-bold text-2xl text-zinc-100">{sheet.title}</h1>
            {sheet.description && <p className="text-sm text-zinc-500 mt-1">{sheet.description}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-bold font-display text-green-400">{pct}%</p>
            <p className="text-xs text-zinc-600">{totalSolved} / {total} solved</p>
          </div>
        </div>
        <ProgressBar pct={pct} className="mt-4" />
      </Card>

      {/* Topics accordion */}
      {tLoading ? (
        <div className="flex justify-center py-10"><Spinner size={24} /></div>
      ) : (
        <div className="space-y-2">
          {topics?.map((topic, ti) => {
            const tProbs = byTopic[topic.id] ?? [];
            const tSolved = tProbs.filter(p => solved.has(p.id)).length;
            const isOpen = expanded.has(topic.id);
            const done = tProbs.length > 0 && tSolved === tProbs.length;

            return (
              <Card key={topic.id} className="overflow-hidden">
                {/* Topic row */}
                <button onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(topic.id) ? n.delete(topic.id) : n.add(topic.id); return n; })}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#1a1a20] transition-colors text-left">
                  <span className="w-6 h-6 rounded-md bg-[#1e1e26] flex items-center justify-center text-xs font-mono text-zinc-600 flex-shrink-0">
                    {ti + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{topic.title}</p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-xs font-mono text-zinc-600">{tSolved}/{tProbs.length}</span>
                    {done && <CheckCircle2 size={14} className="text-green-400" />}
                    <ChevronDown size={14} className={cn('text-zinc-600 transition-transform duration-200', isOpen && 'rotate-180')} />
                  </div>
                </button>

                {/* Problem rows */}
                {isOpen && (
                  <div className="border-t border-[#1e1e24]">
                    {tProbs.length === 0 ? (
                      <p className="px-5 py-3 text-xs text-zinc-600">No problems yet</p>
                    ) : tProbs.map((prob, pi) => {
                      const isSolved = solved.has(prob.id);
                      const isPending = pending === prob.id;
                      return (
                        <div key={prob.id}
                          className={cn('flex items-center gap-3 px-5 py-3 border-b border-[#181820] last:border-0 transition-colors',
                            isSolved ? 'bg-green-500/[0.03]' : 'hover:bg-[#171720]')}>

                          {/* Checkbox */}
                          <button onClick={() => toggle(prob)} disabled={!isAuthenticated || isPending}
                            className={cn('flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150',
                              isSolved ? 'bg-green-500 border-green-500' : 'border-[#3a3a44] hover:border-green-600',
                              !isAuthenticated && 'opacity-30 cursor-not-allowed')}>
                            {isPending ? <Spinner size={10} color="#fff" /> : isSolved && <Check size={10} className="text-white" />}
                          </button>

                          <span className="text-[11px] text-zinc-700 font-mono w-5 text-center flex-shrink-0">{pi + 1}</span>

                          <span className={cn('flex-1 text-sm transition-colors', isSolved ? 'text-zinc-600 line-through' : 'text-zinc-300')}>
                            {prob.title}
                          </span>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn('text-xs font-medium', diffBg(prob.difficulty).split(' ')[1])}>
                              {prob.difficulty}
                            </span>
                            {prob.isPremium && <Lock size={11} className="text-amber-600" />}
                          </div>

                          {/* External links */}
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {prob.leetcodeUrl && (
                              <a href={prob.leetcodeUrl} target="_blank" rel="noreferrer" title="LeetCode"
                                onClick={e => e.stopPropagation()}
                                className="p-1.5 rounded-lg text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10 transition-all">
                                <Code size={13} />
                              </a>
                            )}
                            {prob.articleUrl && (
                              <a href={prob.articleUrl} target="_blank" rel="noreferrer" title="Article"
                                onClick={e => e.stopPropagation()}
                                className="p-1.5 rounded-lg text-zinc-600 hover:text-sky-400 hover:bg-sky-500/10 transition-all">
                                <FileText size={13} />
                              </a>
                            )}
                            {prob.videoUrl && (
                              <a href={prob.videoUrl} target="_blank" rel="noreferrer" title="Video"
                                onClick={e => e.stopPropagation()}
                                className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                <Play size={13} />
                              </a>
                            )}
                          </div>

                          {/* Tags */}
                          <div className="hidden lg:flex gap-1 flex-shrink-0">
                            {prob.tags.slice(0, 2).map(t => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-[#1e1e26] text-[10px] text-zinc-600 border border-[#2a2a32]">{t}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
