interface SolveDate { solvedAt: Date; }

export const computeStreak = (
  solvedProblems: SolveDate[]
): { current: number; longest: number } => {
  if (!solvedProblems.length) return { current: 0, longest: 0 };

  const uniqueDates = [
    ...new Set(solvedProblems.map((p) => p.solvedAt.toISOString().split("T")[0])),
  ].sort() as string[];

  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const diff =
      (new Date(uniqueDates[i]!).getTime() - new Date(uniqueDates[i - 1]!).getTime()) /
      86400000;
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const lastDate  = uniqueDates[uniqueDates.length - 1];

  if (lastDate !== today && lastDate !== yesterday) current = 0;

  return { current, longest };
};
