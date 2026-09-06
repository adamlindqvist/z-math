import { describe, it, expect } from "vitest";
import { generateAdditionQuestion } from "../src/math/questionGenerators";
describe("addition generator", () => {
  it("generates valid sums and four unique options across 1000 questions", () => {
    let seed = 71;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const sums = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const q = generateAdditionQuestion(random);
      const terms = q.question.match(/\d+/g)!.map(Number);
      expect(terms[0] + terms[1]).toBe(q.correctAnswer);
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(q.correctAnswer).toBeLessThanOrEqual(10);
      expect(new Set(q.answers).size).toBe(4);
      expect(q.answers.filter((a) => a === q.correctAnswer)).toHaveLength(1);
      expect(
        q.answers.every((n) => Number.isInteger(n) && n >= 0 && n <= 10),
      ).toBe(true);
      sums.add(q.correctAnswer);
    }
    expect(sums.size).toBe(11);
  });
  it("handles random boundary values", () => {
    expect(generateAdditionQuestion(() => 0).correctAnswer).toBe(0);
    expect(generateAdditionQuestion(() => 0.999999).correctAnswer).toBe(10);
  });
});
