import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  MessageSquare, ThumbsUp, Building2, Calendar,
  Plus, Search, ChevronDown
} from 'lucide-react';
import { interviewApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { InterviewExperience } from '../../types';
import { Card, Badge, Button, Spinner, Empty, Select, Modal, Textarea } from '../ui';
import { PageHeader, BackLink } from '../layout/AppLayout';
import { cn, diffBg, outcomeColor, outcomeLabel, yoeLabel, fmtDate } from '../../utils';

const YOE_OPTS = [
  { value: '', label: 'All Experience' },
  { value: 'fresher', label: 'Fresher' }, { value: 'one_to_three', label: '1–3 yrs' },
  { value: 'three_to_five', label: '3–5 yrs' }, { value: 'five_plus', label: '5+ yrs' },
];
const OUT_OPTS = [
  { value: '', label: 'All Outcomes' },
  { value: 'selected', label: '✓ Selected' }, { value: 'rejected', label: '✗ Rejected' }, { value: 'in_progress', label: 'In Progress' },
];

/* ── List ─────────────────────────────────────────── */
export function InterviewsPage() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [company, setCompany] = useState('');
  const [outcome, setOutcome] = useState('');
  const [yoe, setYoe] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: interviews, isLoading } = useQuery({
    queryKey: ['interviews', company, outcome, yoe],
    queryFn: () => interviewApi.getInterviews({ company: company || undefined, outcome: outcome || undefined, yoe: yoe || undefined }),
    select: r => r.data.data as InterviewExperience[],
  });
  const { data: companies } = useQuery({
    queryKey: ['companies'], queryFn: () => interviewApi.getCompanies(), select: r => r.data.data as string[],
  });

  const upvoteMut = useMutation({
    mutationFn: (id: string) => interviewApi.upvote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });

  const companyOptions = [{ value: '', label: 'All Companies' }, ...(companies?.map(c => ({ value: c, label: c })) ?? [])];

  return (
    <div className="anim-up">
      <PageHeader
        title="Interview Experiences"
        subtitle="Real stories from the community to guide your prep"
        action={isAuthenticated ? (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Share
          </Button>
        ) : undefined}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="w-44"><Select value={company} onChange={e => setCompany(e.target.value)} options={companyOptions} /></div>
        <div className="w-40"><Select value={outcome} onChange={e => setOutcome(e.target.value)} options={OUT_OPTS} /></div>
        <div className="w-40"><Select value={yoe} onChange={e => setYoe(e.target.value)} options={YOE_OPTS} /></div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : !interviews?.length ? (
        <Empty icon={<MessageSquare size={24} />} title="No experiences yet"
          description="Be the first to share your interview story"
          action={isAuthenticated ? <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} />Share Experience</Button> : undefined} />
      ) : (
        <div className="space-y-3 stagger">
          {interviews.map(exp => (
            <InterviewCard key={exp.id} exp={exp}
              onUpvote={() => isAuthenticated && upvoteMut.mutate(exp.id)} />
          ))}
        </div>
      )}

      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function InterviewCard({ exp, onUpvote }: { exp: InterviewExperience; onUpvote: () => void }) {
  const { isAuthenticated } = useAuthStore();
  return (
    <Link to={`/interviews/${exp.id}`}>
      <Card className="p-5 hover:border-[#3a3a42] transition-all group cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#1c1c22] border border-[#2a2a30] group-hover:border-[#3a3a42] flex items-center justify-center flex-shrink-0 transition-colors">
            <Building2 size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-display font-semibold text-zinc-100 group-hover:text-green-400 transition-colors">{exp.company}</span>
              <span className="text-zinc-600 text-xs">·</span>
              <span className="text-sm text-zinc-400">{exp.role}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
              <span className="font-medium" style={{ color: outcomeColor(exp.outcome) }}>{outcomeLabel(exp.outcome)}</span>
              <span className="text-zinc-700">·</span>
              <span className={diffBg(exp.difficulty).split(' ')[1]}>{exp.difficulty}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500">{yoeLabel(exp.yoe)}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-600 flex items-center gap-1"><Calendar size={10} />{fmtDate(exp.createdAt)}</span>
            </div>
            <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{exp.overallExperience}</p>
            <div className="flex gap-1 flex-wrap">
              {exp.tags.slice(0, 5).map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-[#1e1e26] border border-[#2a2a32] text-[10px] text-zinc-600">{t}</span>
              ))}
            </div>
          </div>

          {/* Upvote */}
          <button onClick={e => { e.preventDefault(); onUpvote(); }}
            className={cn('flex flex-col items-center gap-1 p-2 rounded-xl flex-shrink-0 transition-all',
              isAuthenticated ? 'hover:bg-green-500/10 hover:text-green-400 text-zinc-600' : 'text-zinc-700 cursor-default')}>
            <ThumbsUp size={14} />
            <span className="text-xs font-mono">{exp.upvoteCount}</span>
          </button>
        </div>
      </Card>
    </Link>
  );
}

/* ── Detail ───────────────────────────────────────── */
export function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const { data: exp, isLoading } = useQuery({
    queryKey: ['interview', id], queryFn: () => interviewApi.getById(id!),
    select: r => r.data.data as InterviewExperience, enabled: !!id,
  });
  const upvoteMut = useMutation({
    mutationFn: () => interviewApi.upvote(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interview', id] }),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
  if (!exp) return <div className="py-20 text-center text-zinc-500">Not found</div>;

  const roundResultColor = (r: string) => r === 'passed' ? '#22c55e' : r === 'failed' ? '#ef4444' : '#f59e0b';

  return (
    <div className="max-w-2xl mx-auto anim-up">
      <BackLink to="/interviews" label="Back to experiences" />

      <Card className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-xl text-zinc-100">{exp.company}</h1>
            <p className="text-sm text-zinc-400">{exp.role}</p>
          </div>
          <button onClick={() => isAuthenticated && upvoteMut.mutate()}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2a2a30] text-sm transition-all',
              isAuthenticated ? 'hover:border-green-500/30 hover:text-green-400 text-zinc-500' : 'text-zinc-700 cursor-default')}>
            <ThumbsUp size={14} />
            <span className="font-mono">{exp.upvoteCount}</span>
          </button>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium border" style={{ color: outcomeColor(exp.outcome), borderColor: `${outcomeColor(exp.outcome)}30`, background: `${outcomeColor(exp.outcome)}10` }}>
            {outcomeLabel(exp.outcome)}
          </span>
          <Badge variant={exp.difficulty}>{exp.difficulty}</Badge>
          <Badge variant="zinc">{yoeLabel(exp.yoe)}</Badge>
          {exp.package && <Badge variant="green">₹{exp.package} LPA</Badge>}
          <Badge variant="zinc"><Calendar size={10} />{fmtDate(exp.interviewDate)}</Badge>
        </div>

        {/* Experience */}
        <div>
          <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-2">Overall Experience</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{exp.overallExperience}</p>
        </div>

        {/* Tips */}
        {exp.tips && (
          <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/15">
            <p className="text-xs font-medium text-green-500 uppercase tracking-widest mb-2">💡 Tips for candidates</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{exp.tips}</p>
          </div>
        )}

        {/* Rounds */}
        {exp.rounds.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-3">Interview Rounds ({exp.rounds.length})</p>
            <div className="space-y-3">
              {exp.rounds.map((round, i) => (
                <div key={round.id} className="p-4 rounded-xl bg-[#0e0e11] border border-[#1e1e24]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-zinc-200">
                      <span className="font-mono text-zinc-600 mr-2">R{i + 1}.</span>{round.roundName}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={round.difficulty}>{round.difficulty}</Badge>
                      <span className="text-xs font-medium capitalize" style={{ color: roundResultColor(round.result) }}>{round.result}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">{round.description}</p>
                  {round.questions.length > 0 && (
                    <div className="space-y-1.5">
                      {round.questions.map((q, qi) => (
                        <p key={qi} className="text-xs text-zinc-400 pl-3 border-l-2 border-[#2a2a30]">
                          <span className="text-zinc-700 mr-2">{qi + 1}.</span>{q}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {exp.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[#1e1e24]">
            {exp.tags.map(t => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-[#1a1a20] border border-[#2a2a30] text-xs text-zinc-500">{t}</span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Create modal ─────────────────────────────────── */
function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    company: '', role: '', yoe: 'fresher', outcome: 'in_progress', difficulty: 'medium',
    overallExperience: '', tips: '', interviewDate: new Date().toISOString().slice(0, 10),
    tags: '', package: '', isAnonymous: false,
  });

  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await interviewApi.create({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        interviewDate: new Date(form.interviewDate).toISOString(),
      });
      qc.invalidateQueries({ queryKey: ['interviews'] });
      onClose();
      setForm({ company: '', role: '', yoe: 'fresher', outcome: 'in_progress', difficulty: 'medium', overallExperience: '', tips: '', interviewDate: new Date().toISOString().slice(0, 10), tags: '', package: '', isAnonymous: false });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share Your Interview Experience" maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Company *</label>
            <input required value={form.company} onChange={set('company')} placeholder="e.g. Google"
              className="w-full bg-[#1c1c22] border border-[#2e2e35] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Role *</label>
            <input required value={form.role} onChange={set('role')} placeholder="e.g. SWE Intern"
              className="w-full bg-[#1c1c22] border border-[#2e2e35] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Select label="Experience" value={form.yoe} onChange={e => setForm(f => ({ ...f, yoe: e.target.value }))}
            options={[{ value: 'fresher', label: 'Fresher' }, { value: 'one_to_three', label: '1–3 yrs' }, { value: 'three_to_five', label: '3–5 yrs' }, { value: 'five_plus', label: '5+ yrs' }]} />
          <Select label="Outcome" value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
            options={[{ value: 'selected', label: 'Selected' }, { value: 'rejected', label: 'Rejected' }, { value: 'in_progress', label: 'In Progress' }]} />
          <Select label="Difficulty" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
            options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Interview Date</label>
            <input type="date" value={form.interviewDate} onChange={set('interviewDate')}
              className="w-full bg-[#1c1c22] border border-[#2e2e35] rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500/40" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Package (LPA, optional)</label>
            <input value={form.package} onChange={set('package')} placeholder="e.g. 24"
              className="w-full bg-[#1c1c22] border border-[#2e2e35] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40" />
          </div>
        </div>

        <Textarea label="Overall Experience *" required value={form.overallExperience} onChange={set('overallExperience')}
          placeholder="Describe the interview process, culture, what went well, what didn't…" rows={4} />

        <Textarea label="Tips for future candidates (optional)" value={form.tips} onChange={set('tips')}
          placeholder="Share advice that would help others preparing for this company…" rows={3} />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">Tags (comma-separated)</label>
          <input value={form.tags} onChange={set('tags')} placeholder="DSA, System Design, Behavioral, SQL…"
            className="w-full bg-[#1c1c22] border border-[#2e2e35] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
            className="w-4 h-4 rounded accent-green-500" />
          <span className="text-xs text-zinc-500">Post anonymously</span>
        </label>

        <div className="flex justify-end gap-3 pt-2 border-t border-[#1e1e24]">
          <Button variant="secondary" type="button" onClick={onClose} size="sm">Cancel</Button>
          <Button type="submit" loading={loading} size="sm">Submit Experience</Button>
        </div>
      </form>
    </Modal>
  );
}
