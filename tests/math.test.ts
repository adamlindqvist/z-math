import { describe, it, expect } from "vitest";
import {
  generateAdditionQuestion,
  generateTempleQuestion,
} from "../src/math/questionGenerators";
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

describe("question repetition", () => {
  const seeded = (start: number) => {
    let seed = start;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  };
  it("never repeats an addition question while the pool lasts", () => {
    const random = seeded(31);
    const asked: string[] = [];
    for (let i = 0; i < 66; i++) {
      const q = generateAdditionQuestion(random, asked);
      expect(asked).not.toContain(q.key);
      asked.push(q.key);
    }
    expect(new Set(asked).size).toBe(66);
  });
  it.each(["counting", "addition"] as const)(
    "never repeats a %s temple question while the pool lasts",
    (kind) => {
      const random = seeded(97);
      const size = kind === "counting" ? 5 : 10;
      const asked: string[] = [];
      for (let i = 0; i < size; i++) {
        const q = generateTempleQuestion(kind, random, asked);
        expect(asked).not.toContain(q.key);
        expect(q.correctAnswer).toBe(q.groups!.reduce((a, b) => a + b, 0));
        expect(q.correctAnswer).toBeGreaterThanOrEqual(1);
        expect(q.correctAnswer).toBeLessThanOrEqual(5);
        asked.push(q.key);
      }
      expect(new Set(asked).size).toBe(size);
    },
  );
  it("forgets the oldest questions once the pool is exhausted", () => {
    const random = seeded(5);
    const asked: string[] = [];
    for (let i = 0; i < 20; i++) {
      const q = generateTempleQuestion("counting", random, asked);
      // Only five counting variants exist, so the pool has to wrap around.
      expect(asked.slice(-4)).not.toContain(q.key);
      asked.push(q.key);
    }
  });
});
