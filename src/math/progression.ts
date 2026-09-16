export type MathLevel = 1 | 2 | 3 | 4;
export interface MathProgress {
  level: MathLevel;
  streak: number;
}

export const freshMathProgress = (): MathProgress => ({ level: 1, streak: 0 });

export function parseMathProgress(value: unknown): MathProgress {
  if (!value || typeof value !== "object") return freshMathProgress();
  const p = value as Partial<MathProgress>;
  if (
    !Number.isInteger(p.level) ||
    p.level! < 1 ||
    p.level! > 4 ||
    !Number.isSafeInteger(p.streak) ||
    p.streak! < 0 ||
    (p.level !== 4 && p.streak! >= 5)
  )
    return freshMathProgress();
  return { level: p.level!, streak: p.streak! };
}

export function recordMathAnswer(
  progress: MathProgress,
  correct: boolean,
): MathProgress {
  if (!correct) return { ...progress, streak: 0 };
  const streak = Math.min(progress.streak + 1, Number.MAX_SAFE_INTEGER);
  if (progress.level < 4 && streak >= 5)
    return { level: (progress.level + 1) as MathLevel, streak: 0 };
  return { ...progress, streak };
}
