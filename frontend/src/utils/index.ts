export const cn = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ');

export const diffColor = (d: string) =>
  d === 'easy' ? '#22c55e' : d === 'medium' ? '#f59e0b' : d === 'hard' ? '#ef4444' : '#a855f7';

export const diffBg = (d: string) =>
  d === 'easy'   ? 'bg-green-500/10 text-green-400'
  : d === 'medium' ? 'bg-amber-500/10 text-amber-400'
  : d === 'hard'   ? 'bg-red-500/10 text-red-400'
  : 'bg-purple-500/10 text-purple-400';

export const sheetDiffBg = (d: string) =>
  d === 'beginner'     ? 'bg-green-500/10 text-green-400'
  : d === 'intermediate' ? 'bg-amber-500/10 text-amber-400'
  : 'bg-red-500/10 text-red-400';

export const outcomeColor = (o: string) =>
  o === 'selected' ? '#22c55e' : o === 'rejected' ? '#ef4444' : '#f59e0b';

export const outcomeLabel = (o: string) =>
  o === 'selected' ? 'Selected' : o === 'rejected' ? 'Rejected' : 'In Progress';

export const yoeLabel = (y: string) =>
  ({ fresher: 'Fresher', one_to_three: '1–3 yrs', three_to_five: '3–5 yrs', five_plus: '5+ yrs' }[y] ?? y);

export const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const fmtSecs = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

export const initials = (n: string) =>
  n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export function heatmapColor(count: number): string {
  if (count === 0) return 'bg-[#1a1a1f]';
  if (count === 1) return 'bg-green-900';
  if (count <= 3) return 'bg-green-700';
  if (count <= 6) return 'bg-green-600';
  return 'bg-green-400';
}
