import type { MathQuestion } from "./types";
import type { MathLevel } from "./progression";

let sequence = 0;
const shuffle = (values: number[], random: () => number) => {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
};

type Category = "counting" | "addition" | "subtraction";
interface Variant {
  key: string;
  category: Category;
  a: number;
  b: number;
  max: number;
}

const pools = new Map<MathLevel, Variant[]>();
for (const level of [1, 2, 3, 4] as const) {
  const variants: Variant[] = [];
  const add = (category: Category, a: number, b: number, max: number) =>
    variants.push({ key: `${category}-${a}-${b}`, category, a, b, max });
  if (level === 1) for (let a = 1; a <= 5; a++) add("counting", a, 0, 5);
  const max = level === 1 ? 5 : 10;
  for (let a = 1; a < max; a++)
    for (let b = 1; a + b <= max; b++) add("addition", a, b, max);
  if (level >= 3) {
    const subtractionMax = level === 3 ? 5 : 10;
    for (let a = 1; a <= subtractionMax; a++)
      for (let b = 1; b <= a; b++) add("subtraction", a, b, subtractionMax);
  }
  pools.set(level, variants);
}

/** Prefer unseen content across categories; once exhausted, reuse oldest first. */
export function generateQuestion(
  level: MathLevel,
  random: () => number = Math.random,
  asked: readonly string[] = [],
): MathQuestion {
  const variants = pools.get(level)!;
  let available: Variant[] = [];
  for (let dropped = 0; dropped <= asked.length; dropped++) {
    const used = new Set(asked.slice(dropped));
    available = variants.filter((v) => !used.has(v.key));
    if (available.length) break;
  }
  // Equal category probability while both categories have unseen questions.
  const categories = [...new Set(available.map((v) => v.category))];
  const category = categories[Math.floor(random() * categories.length)];
  const candidates = available.filter((v) => v.category === category);
  const { a, b, key, max } =
    candidates[Math.floor(random() * candidates.length)];
  const correctAnswer = category === "subtraction" ? a - b : a + b;
  const min = category === "subtraction" ? 0 : 1;
  const wrong = Array.from({ length: max - min + 1 }, (_, i) => i + min).filter(
    (n) => n !== correctAnswer,
  );
  return {
    id: `${key}-${sequence++}`,
    key,
    category,
    difficulty: level,
    question:
      category === "counting"
        ? "Hur många?"
        : `${a} ${category === "addition" ? "+" : "−"} ${b} = ?`,
    correctAnswer,
    groups: category === "addition" ? [a, b] : [a],
    ...(category === "subtraction" ? { removedCount: b } : {}),
    answerDots: true,
    answers: shuffle(
      [correctAnswer, ...shuffle(wrong, random).slice(0, 2)],
      random,
    ),
  };
}
