export type MathCategory =
  "addition" | "subtraction" | "counting" | "comparison" | "sequence";
export interface MathQuestion {
  id: string;
  /** Stable identity of the question content, used to avoid repeats in a session. */
  key: string;
  question: string;
  answers: number[];
  correctAnswer: number;
  groups?: number[];
  /** Cross out this many objects in the single subtraction group. */
  removedCount?: number;
  answerDots?: boolean;
  difficulty: number;
  category: MathCategory;
}
