export type MathCategory =
  "addition" | "subtraction" | "counting" | "comparison" | "sequence";
export interface MathQuestion {
  id: string;
  question: string;
  answers: number[];
  correctAnswer: number;
  groups?: number[];
  answerDots?: boolean;
  difficulty: number;
  category: MathCategory;
}
