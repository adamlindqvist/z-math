export type MathCategory =
  "addition" | "subtraction" | "counting" | "comparison" | "sequence";
export interface MathQuestion {
  id: string;
  question: string;
  answers: number[];
  correctAnswer: number;
  difficulty: number;
  category: MathCategory;
}
