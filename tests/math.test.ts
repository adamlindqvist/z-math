import { describe, it, expect } from "vitest";
import { generateQuestion } from "../src/math/questionGenerators";

const seeded = (start: number) => {
  let seed = start;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};

describe("adaptive questions", () => {
  it.each([1, 2, 3, 4] as const)(
    "generates correct, illustrated level %i questions",
    (level) => {
      const random = seeded(71);
      const categories = new Map<string, number>();
      for (let i = 0; i < 1000; i++) {
        const q = generateQuestion(level, random);
        categories.set(q.category, (categories.get(q.category) ?? 0) + 1);
        expect(q.difficulty).toBe(level);
        expect(q.answerDots).toBe(true);
        expect(q.groups!.every((n) => n >= 1 && n <= 10)).toBe(true);
        const total = q.groups!.reduce((a, b) => a + b, 0);
        expect(q.correctAnswer).toBe(total - (q.removedCount ?? 0));
        const max =
          level === 1 || (level === 3 && q.category === "subtraction") ? 5 : 10;
        expect(total).toBeLessThanOrEqual(max);
        expect(q.answers).toHaveLength(3);
        expect(new Set(q.answers).size).toBe(3);
        expect(q.answers.filter((a) => a === q.correctAnswer)).toHaveLength(1);
        expect(
          q.answers.every((n) => Number.isInteger(n) && n >= 0 && n <= max),
        ).toBe(true);
        if (q.category === "subtraction") {
          expect(q.groups).toHaveLength(1);
          expect(q.removedCount).toBeGreaterThanOrEqual(1);
          expect(q.removedCount).toBeLessThanOrEqual(total);
          expect(q.question).toBe(`${total} − ${q.removedCount} = ?`);
        } else if (q.category === "addition") {
          expect(q.groups).toHaveLength(2);
          expect(q.question).toBe(`${q.groups![0]} + ${q.groups![1]} = ?`);
        } else expect(q.category).toBe("counting");
      }
      const expected =
        level === 1
          ? ["addition", "counting"]
          : level === 2
            ? ["addition"]
            : ["addition", "subtraction"];
      expect([...categories.keys()].sort()).toEqual(expected);
      if (expected.length === 2)
        for (const count of categories.values())
          expect(count).toBeGreaterThan(400);
    },
  );

  it.each([
    [1, 15],
    [2, 45],
    [3, 60],
    [4, 100],
  ] as const)(
    "exhausts level %i content before reusing the oldest question",
    (level, size) => {
      const random = seeded(31);
      const asked: string[] = [];
      for (let i = 0; i < size * 2; i++) {
        const q = generateQuestion(level, random, asked);
        expect(asked.slice(-(size - 1))).not.toContain(q.key);
        asked.push(q.key);
      }
      expect(new Set(asked).size).toBe(size);
    },
  );

  it.each([
    [1, "counting", 5],
    [1, "addition", 10],
    [2, "counting", 10],
    [2, "addition", 45],
    [3, "subtraction", 15],
    [4, "subtraction", 55],
  ] as const)(
    "keeps level %i %s questions distinct until the pool is exhausted",
    (level, category, size) => {
      const asked: string[] = [];
      const random = seeded(49);
      for (let i = 0; i < size * 2; i++) {
        const q = generateQuestion(level, random, asked, category);
        expect(q.category).toBe(category);
        expect(asked.slice(-(size - 1))).not.toContain(q.key);
        asked.push(q.key);
      }
      expect(new Set(asked).size).toBe(size);
    },
  );

  it("preserves content identity across level changes", () => {
    const first = generateQuestion(2, () => 0);
    const next = generateQuestion(3, () => 0, [first.key]);
    expect(next.key).not.toBe(first.key);
  });

  it.each([0, 0.999999])("handles random boundary %s", (random) => {
    for (const level of [1, 2, 3, 4] as const) {
      const q = generateQuestion(level, () => random);
      expect(q.answers).toContain(q.correctAnswer);
      expect(new Set(q.answers).size).toBe(3);
    }
  });
});
