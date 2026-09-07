import type { MathQuestion } from "./types";
export function generateAdditionQuestion(
  random: () => number = Math.random,
): MathQuestion {
  const a = Math.floor(random() * 11);
  const b = Math.floor(random() * (11 - a));
  const correctAnswer = a + b;
  const candidates = Array.from({ length: 11 }, (_, i) => i).filter(
    (n) => n !== correctAnswer,
  );
  const shuffle = (values: number[]) => {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  };
  return {
    id: `addition-${a}-${b}-${Date.now()}`,
    question: `${a} + ${b} = ?`,
    answers: shuffle([correctAnswer, ...shuffle(candidates).slice(0, 3)]),
    correctAnswer,
    difficulty: 1,
    category: "addition",
  };
}

export function generateTempleQuestion(
  kind: "counting" | "addition",
  random: () => number = Math.random,
): MathQuestion {
  const a = 1 + Math.floor(random() * (kind === "counting" ? 5 : 4));
  const groups =
    kind === "counting" ? [a] : [a, 1 + Math.floor(random() * (5 - a))];
  const correctAnswer = groups.reduce((sum, n) => sum + n, 0);
  const shuffle = (values: number[]) => {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  };
  return {
    id: `temple-${kind}-${Date.now()}`,
    category: kind,
    difficulty: 1,
    question: kind === "counting" ? "Hur många?" : "Hur många tillsammans?",
    correctAnswer,
    groups,
    answerDots: true,
    answers: shuffle([
      correctAnswer,
      ...shuffle([1, 2, 3, 4, 5].filter((n) => n !== correctAnswer)).slice(
        0,
        2,
      ),
    ]),
  };
}
