// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { Dialogue } from "../src/components/Dialogue";
import { HUD } from "../src/components/HUD";
import { gameStore } from "../src/store/gameStore";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it("shows short animal requests, restored-world thanks, pictures and an accessible exit", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    for (const [world, id, request, thanks] of [
      ["water", "ella", "Hjälp korallerna!", "Vägen till öknen är öppen!"],
      ["desert", "gullan", "Oasen behöver vatten!", "Oasen är grön igen!"],
    ] as const) {
      act(() => {
        gameStore.reset();
        gameStore.openDebug();
        gameStore.debugTravelTo({ world });
        gameStore.closeDebug();
        root.render(
          <>
            <Dialogue />
            <HUD />
          </>,
        );
      });
      act(() => {
        gameStore.setTarget({ kind: "worldObject", id, label: "Prata" });
        gameStore.interact();
      });
      expect(host.querySelector('[role="dialog"]')?.textContent).toContain(
        request,
      );
      expect(host.querySelector('[role="dialog"] svg')).not.toBeNull();
      act(() => {
        [...host.querySelectorAll("button")]
          .find((b) => b.textContent?.includes("Spela vidare"))!
          .click();
      });
      expect(gameStore.getState().overlay).toBeNull();
      act(() => {
        gameStore.openDebug();
        gameStore.debugTravelTo({ dungeon: world, room: "treasure" });
        gameStore.debugCompleteCurrentRoom();
        gameStore.closeDebug();
        gameStore.travelTo({ world });
        gameStore.setTarget({ kind: "worldObject", id, label: "Prata" });
        gameStore.interact();
      });
      expect(host.querySelector('[role="dialog"]')?.textContent).toContain(
        thanks,
      );
    }
  } finally {
    act(() => {
      root.unmount();
      gameStore.reset();
    });
    host.remove();
  }
});
