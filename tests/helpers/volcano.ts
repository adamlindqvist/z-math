import { createGameStore } from "../../src/store/gameStore";
export function defeatGiant(s: ReturnType<typeof createGameStore>) {
  s.updateMinibossPresence("stone_giant", 3);
  const advance = () => s.finishMinibossFeedback(s.getState().encounter!);
  advance();
  for (const pair of [[1, 4], [3, 4], [4, 5]]) {
    for (const value of pair) {
      s.setTarget({ kind: "runeStone", boss: "stone_giant", value, label: "Välj" });
      s.interact();
    }
    advance();
  }
  advance();
}
