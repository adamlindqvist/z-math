import type { MathQuestion } from "./types";

let sequence = 0;

const shuffle = (values: number[], random: () => number) => {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
};

/**
 * Picks a variant that has not been asked yet. When every variant is used up
 * the oldest entries are forgotten one by one, so the questions still spread
 * out as far as the pool allows instead of repeating the most recent ones.
 */
function pickVariant<T>(
  variants: T[],
  key: (variant: T) => string,
  asked: readonly string[],
  random: () => number,
): T {
  for (let dropped = 0; dropped <= asked.length; dropped++) {
    const used = new Set(asked.slice(dropped));
    const available = variants.filter((variant) => !used.has(key(variant)));
    if (available.length)
      return available[Math.floor(random() * available.length)];
  }
  return variants[Math.floor(random() * variants.length)];
}

const additionVariants = Array.from({ length: 11 }, (_, a) =>
  Array.from({ length: 11 - a }, (_, b) => [a, b] as const),
).flat();

const additionKey = ([a, b]: readonly [number, number]) => `addition-${a}-${b}`;

export function generateAdditionQuestion(
  random: () => number = Math.random,
  asked: readonly string[] = [],
): MathQuestion {
  const [a, b] = pickVariant(additionVariants, additionKey, asked, random);
  const correctAnswer = a + b;
  const candidates = Array.from({ length: 11 }, (_, i) => i).filter(
    (n) => n !== correctAnswer,
  );
  return {
    id: `addition-${a}-${b}-${sequence++}`,
    key: additionKey([a, b]),
    question: `${a} + ${b} = ?`,
    answers: shuffle(
      [correctAnswer, ...shuffle(candidates, random).slice(0, 3)],
      random,
    ),
    correctAnswer,
    difficulty: 1,
    category: "addition",
  };
}

const templeVariants: Record<
  "counting" | "addition",
  readonly (readonly number[])[]
> = {
  counting: Array.from({ length: 5 }, (_, i) => [i + 1]),
  addition: Array.from({ length: 4 }, (_, i) =>
    Array.from({ length: 4 - i }, (_, j) => [i + 1, j + 1]),
  ).flat(),
};

const templeKey = (kind: "counting" | "addition", groups: readonly number[]) =>
  `temple-${kind}-${groups.join("-")}`;

export function generateTempleQuestion(
  kind: "counting" | "addition",
  random: () => number = Math.random,
  asked: readonly string[] = [],
): MathQuestion {
  const groups = pickVariant(
    [...templeVariants[kind]],
    (variant) => templeKey(kind, variant),
    asked,
    random,
  );
  const correctAnswer = groups.reduce((sum, n) => sum + n, 0);
  return {
    id: `${templeKey(kind, groups)}-${sequence++}`,
    key: templeKey(kind, groups),
    category: kind,
    difficulty: 1,
    question: kind === "counting" ? "Hur många?" : "Hur många tillsammans?",
    correctAnswer,
    groups: [...groups],
    answerDots: true,
    answers: shuffle(
      [
        correctAnswer,
        ...shuffle(
          [1, 2, 3, 4, 5].filter((n) => n !== correctAnswer),
          random,
        ).slice(0, 2),
      ],
      random,
    ),
  };
}
