import { createGameStore } from "../../src/store/gameStore";
import { RABBITS } from "../../src/game/rabbits/definitions";
export function completeRabbitQuest(store: ReturnType<typeof createGameStore>) {
  store.close();
  store.grantItems(["temple-sword", "temple-shield"]);
  store.setTarget("bokoblin"); store.interact();
  for (const { id } of RABBITS) {
    store.setTarget({ kind: "rabbit", id, label: "Följ med" }); store.interact();
    store.bringRabbitHome(id);
  }
  store.close();
}
