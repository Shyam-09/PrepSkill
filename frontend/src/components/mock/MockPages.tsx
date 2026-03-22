import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ClipboardList, Clock, Trophy, Lock, ChevronLeft,
  ChevronRight, CheckCircle2, XCircle, Users, AlertCircle
} from 'lucide-react';
import { mockApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { MockTest, MockAttempt, MockQuestion } from '../../types';
import { Card, Badge, Button, Spinner, Empty } from '../ui';
import { PageHeader, BackLink } from '../layout/AppLayout';
import { cn, diffBg, fmtSecs } from '../../utils';

/* ── Tests list ───────────────────────────────────── */
export function MockTestsPage() {
  const { isAuthenticated } = useAuthStore();

  const { data: tests, isLoading } = useQuery({
    queryKey: ['mockTests'], queryFn: () => mockApi.getTests(), select: r => r.data.data as MockTest[],
  });
  const { data: myAttempts } = useQuery({
    queryKey: ['myAttempts'], queryFn: () => mockApi.getMyAttempts(),
    enabled: isAuthenticated, select: r => r.data.data as MockAttempt[],
  });

  const attemptMap: Record<string, MockAttempt> = {};
  myAttempts?.forEach(a => { if (!attemptMap[a.testId] || a.status === 'completed') attemptMap[a.testId] = a; });

  return (
    <div className="anim-up">
      <PageHeader title="Mock Tests" subtitle="Practice with timed MCQs, get ranked, review answers" />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : !tests?.length ? (
        <Empty icon={<ClipboardList size={24} />} title="No tests yet" description="Check back soon!" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {tests.map(test => {
            const attempt = attemptMap[test.id];
            const done = attempt?.status === 'completed';
            const pct = done ? Math.round(attempt.percentage) : null;

            return (
              <Card key={test.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-[#1c1c22] border border-[#2a2a30]">
                    <ClipboardList size={16} className="text-zinc-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {test.isPremium && <Lock size={12} className="text-amber-500" />}
                    <Badge variant={test.difficulty}>{test.difficulty}</Badge>
                  </div>
                </div>

                <h3 className="font-display font-semibold text-zinc-100 leading-snug mb-1">{test.title}</h3>
                {test.description && <p className="text-xs text-zinc-600 line-clamp-2 mb-3">{test.description}</p>}

                <div className="flex items-center gap-3 text-xs text-zinc-600 mb-4 mt-auto">
                  <span className="flex items-center gap-1"><Clock size={12} />{test.duration}m</span>
                  <span className="flex items-center gap-1"><Trophy size={12} />{test.totalMarks} marks</span>
                  <span className="flex items-center gap-1"><Users size={12} />{test.totalAttempts}</span>
                </div>

                {done ? (
                  <div className="flex items-center justify-between pt-3 border-t border-[#1e1e24]">
                    <div>
                      <span className="text-xs text-zinc-600">Score: </span>
                      <span className={cn('text-sm font-bold font-mono',
                        pct! >= 70 ? 'text-green-400' : pct! >= 40 ? 'text-amber-400' : 'text-red-400')}>
                        {pct}%
                      </span>
                    </div>
                    <Link to={`/mock/result/${attempt.id}`}>
                      <Button variant="ghost" size="xs">View result</Button>
                    </Link>
                  </div>
                ) : (
                  <Link to={isAuthenticated ? `/mock/${test.id}` : '/login'} className="block">
                    <Button variant="primary" size="sm" fullWidth>
                      {isAuthenticated ? 'Start test' : 'Sign in to start'}
                    </Button>
                  </Link>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Test taking ──────────────────────────────────── */
export function MockTestPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { data: test, isLoading } = useQuery({
    queryKey: ['mockTest', id], queryFn: () => mockApi.getTestById(id!),
    select: r => r.data.data as MockTest & { questions: MockQuestion[] }, enabled: !!id,
  });

  const startMut = useMutation({
    mutationFn: () => mockApi.startAttempt({ testId: id! }),
    onSuccess: r => { setAttemptId(r.data.data.id); setTimeLeft((test!.duration) * 60); setStarted(true); },
  });

  // Timer
  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { submit(); return 0; } return t - 1; }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started]); // eslint-disable-line

  const submit = async () => {
    if (submitting || !attemptId || !test?.questions) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      await mockApi.submitAttempt(attemptId, {
        answers: test.questions.map(q => ({ questionId: q.id, selectedOption: answers[q.id] ?? -1 })),
      });
      qc.invalidateQueries({ queryKey: ['myAttempts'] });
      navigate(`/mock/result/${attemptId}`);
    } catch { setSubmitting(false); }
  };

  if (!isAuthenticated) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle size={32} className="text-zinc-600" />
      <p className="text-zinc-400">Sign in to take mock tests</p>
      <Link to="/login"><Button>Sign in</Button></Link>
    </div>
  );

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!test) return <div className="py-20 text-center text-zinc-500">Test not found</div>;

  const questions = test.questions ?? [];

  // Pre-start screen
  if (!started) {
    return (
      <div className="max-w-md mx-auto anim-up">
        <BackLink to="/mock" label="Back to tests" />
        <Card className="p-8 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-[#1c1c22] border border-[#2a2a30] mb-4">
            <ClipboardList size={28} className="text-zinc-400" />
          </div>
          <h1 className="font-display font-bold text-xl text-zinc-100 mb-1">{test.title}</h1>
          {test.description && <p className="text-sm text-zinc-500 mb-4">{test.description}</p>}

          <div className="flex justify-center gap-8 py-4 mb-6">
            {[['Questions', questions.length], ['Duration', `${test.duration}m`], ['Marks', test.totalMarks]].map(([l, v]) => (
              <div key={l} className="text-center">
                <p className="text-2xl font-bold font-display text-zinc-100">{v}</p>
                <p className="text-xs text-zinc-600">{l}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-500 mb-5 text-left space-y-1">
            <p className="font-medium">Before you start:</p>
            <p>• Timer starts immediately after clicking Start</p>
            <p>• Auto-submitted when time runs out</p>
            <p>• You can navigate between questions freely</p>
          </div>

          <Button onClick={() => startMut.mutate()} loading={startMut.isPending} fullWidth size="lg">
            Start Test
          </Button>
        </Card>
      </div>
    );
  }

  const q = questions[currentQ];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answered = Object.keys(answers).length;
  const isLowTime = timeLeft < 300;

  return (
    <div className="max-w-2xl mx-auto anim-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-zinc-400 truncate max-w-xs">{test.title}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">{answered}/{questions.length} answered</span>
          <div className={cn('font-mono font-bold text-sm px-3 py-1.5 rounded-xl border transition-colors',
            isLowTime ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#1c1c22] border-[#2a2a30] text-zinc-200')}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Question card */}
      <Card className="p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#1e1e26] text-xs font-mono text-zinc-500">Q{currentQ + 1}/{questions.length}</span>
            <Badge variant={q.difficulty}>{q.difficulty}</Badge>
          </div>
          <span className="text-xs text-zinc-600">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-zinc-100 text-base leading-relaxed mb-5">{q.question}</p>

        <div className="space-y-2">
          {q.options.map((opt, idx) => (
            <button key={idx} onClick={() => setAnswers(a => ({ ...a, [q.id]: idx }))}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-100',
                answers[q.id] === idx
                  ? 'border-green-600/60 bg-green-500/10 text-green-300'
                  : 'border-[#2a2a30] hover:border-[#3a3a42] text-zinc-300 hover:bg-[#1c1c22]'
              )}>
              <span className="font-mono text-xs text-zinc-600 mr-3">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          ))}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="secondary" onClick={() => setCurrentQ(c => Math.max(0, c - 1))} disabled={currentQ === 0} size="sm">
          <ChevronLeft size={14} /> Prev
        </Button>

        {/* Question dots */}
        <div className="flex gap-1 flex-wrap justify-center">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentQ(i)}
              className={cn('w-7 h-7 rounded-lg text-xs font-mono transition-all duration-100',
                i === currentQ ? 'bg-green-500 text-white' :
                answers[questions[i].id] !== undefined ? 'bg-green-500/20 text-green-500' :
                'bg-[#1e1e26] text-zinc-600 hover:bg-[#26262e]')}>
              {i + 1}
            </button>
          ))}
        </div>

        {currentQ < questions.length - 1 ? (
          <Button variant="secondary" onClick={() => setCurrentQ(c => Math.min(questions.length - 1, c + 1))} size="sm">
            Next <ChevronRight size={14} />
          </Button>
        ) : (
          <Button onClick={submit} loading={submitting} size="sm">
            Submit
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Result page ──────────────────────────────────── */
export function MockResultPage() {
  const { id } = useParams<{ id: string }>();

  const { data: attempt, isLoading } = useQuery({
    queryKey: ['attempt', id], queryFn: () => mockApi.getAttemptById(id!),
    select: r => r.data.data as MockAttempt & { answers: any[]; test: MockTest & { questions: MockQuestion[] } },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!attempt) return <div className="py-20 text-center text-zinc-500">Result not found</div>;

  const pct = Math.round(attempt.percentage);
  const correct = attempt.answers?.filter(a => a.isCorrect).length ?? 0;
  const total = attempt.answers?.length ?? 0;
  const ansMap: Record<string, any> = {};
  attempt.answers?.forEach(a => { ansMap[a.questionId] = a; });

  const scoreColor = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = pct >= 70 ? 'Great job!' : pct >= 40 ? 'Good effort!' : 'Keep practicing!';

  return (
    <div className="max-w-2xl mx-auto anim-up">
      <BackLink to="/mock" label="Back to tests" />

      {/* Score banner */}
      <Card className="p-8 text-center mb-6">
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2">{attempt.test?.title}</p>
        <div className="text-7xl font-bold font-display mb-2" style={{ color: scoreColor }}>{pct}%</div>
        <p className="text-zinc-500 text-sm mb-6">{scoreLabel}</p>
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[#1e1e24]">
          <div><p className="text-xl font-bold font-display text-zinc-100">{correct}/{total}</p><p className="text-xs text-zinc-600">Correct</p></div>
          <div><p className="text-xl font-bold font-display text-zinc-100">{attempt.score}/{attempt.totalMarks}</p><p className="text-xs text-zinc-600">Score</p></div>
          <div><p className="text-xl font-bold font-display text-zinc-100">{fmtSecs(attempt.timeTakenSeconds)}</p><p className="text-xs text-zinc-600">Time</p></div>
        </div>
      </Card>

      {/* Question review */}
      <h2 className="font-display font-semibold text-base text-zinc-200 mb-3">Question Review</h2>
      <div className="space-y-3">
        {attempt.test?.questions?.map((q, i) => {
          const ans = ansMap[q.id];
          const isCorrect = ans?.isCorrect;
          return (
            <Card key={q.id} className={cn('p-5 border', isCorrect ? 'border-green-500/20' : 'border-red-500/15')}>
              <div className="flex items-start gap-3">
                {isCorrect
                  ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  : <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 mb-3">
                    <span className="font-mono text-xs text-zinc-600 mr-2">Q{i + 1}.</span>{q.question}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, idx) => {
                      const isSelected = ans?.selectedOption === idx;
                      const isCorrectOpt = q.correctAnswer === idx;
                      return (
                        <div key={idx} className={cn('px-3 py-2 rounded-lg text-xs border',
                          isCorrectOpt ? 'border-green-600/40 bg-green-500/8 text-green-300' :
                          isSelected ? 'border-red-500/30 bg-red-500/8 text-red-300' :
                          'border-[#222228] text-zinc-600')}>
                          <span className="font-mono mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
                          {isCorrectOpt && <span className="ml-2 text-green-500">✓ Correct</span>}
                          {isSelected && !isCorrectOpt && <span className="ml-2 text-red-500">✗ Your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="mt-3 pt-3 border-t border-[#1e1e24]">
                      <p className="text-xs text-zinc-500">
                        <span className="text-zinc-400 font-medium">Explanation: </span>{q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
