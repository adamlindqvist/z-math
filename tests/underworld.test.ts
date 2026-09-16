import { expect, it } from "vitest";
import { UnderworldArea } from "../src/game/UnderworldArea";

it("lets the player reach Ganondorf, walk around him and return without starting a boss encounter", () => {
  const area = new UnderworldArea();
  try {
    const boss = area.root.getObjectByName("ganondorf")!;
    expect(boss).toBeDefined();
    expect(boss.position.z).toBeLessThan(-20);
    const player = { ...area.spawn };
    area.collision.move(
      player,
      boss.position.x - player.x,
      boss.position.z + 1.6 - player.z,
    );
    expect(player.x).toBeCloseTo(boss.position.x);
    expect(player.z).toBeCloseTo(boss.position.z + 1.6);
    expect(area.collision.free(boss.position.x, boss.position.z)).toBe(false);
    expect(area.collision.free(boss.position.x + 1.3, boss.position.z)).toBe(false);
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      expect(
        area.collision.free(
          boss.position.x + Math.cos(angle) * 1.7,
          boss.position.z + Math.sin(angle) * 1.7,
        ),
      ).toBe(true);
    }
    area.update(1, 1);
    expect(area.interactions()).toEqual([]);
    expect(area.rupees).toEqual([]);
    const exit = area.passages()[0];
    area.collision.move(player, exit.x - player.x, exit.z - player.z);
    expect(player.x).toBeCloseTo(exit.x);
    expect(player.z).toBeCloseTo(exit.z);
    expect(exit.destination).toEqual({ world: "desert" });
  } finally {
    area.dispose();
  }
});
