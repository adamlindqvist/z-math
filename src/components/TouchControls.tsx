import { useEffect, useRef, useState } from "react";
import type { RefObject, PointerEvent } from "react";
import { Hand, MessageCircle, LockKeyhole, Footprints } from "lucide-react";
import type { Game } from "../game/Game";
import {
  gameStore,
  useGameState,
  hasBridgeEquipment,
} from "../store/gameStore";
export function TouchControls({ game }: { game: RefObject<Game | null> }) {
  const state = useGameState();
  const active = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const reset = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    if (game.current) game.current.input.touch = { x: 0, y: 0 };
  };
  const locationKey = JSON.stringify(state.location);
  useEffect(() => {
    reset();
  }, [state.overlay, locationKey, state.resetId]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) reset();
    };
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (active.current !== e.pointerId || gameStore.getState().overlay) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left - rect.width / 2,
      y = e.clientY - rect.top - rect.height / 2;
    const radius = Math.max(1, rect.width / 2 - 38);
    const d = Math.hypot(x, y);
    if (d > radius) {
      x = (x / d) * radius;
      y = (y / d) * radius;
    }
    setKnob({ x, y });
    if (game.current)
      game.current.input.touch = { x: x / radius, y: y / radius };
  };
  if (state.overlay) return null;
  return (
    <div className="pointer-events-none absolute right-[max(24px,env(safe-area-inset-right))] bottom-[max(20px,env(safe-area-inset-bottom))] left-[max(24px,env(safe-area-inset-left))] z-6 flex items-end justify-center gap-5 [@media(pointer:coarse)]:justify-between max-[600px]:right-4 max-[600px]:left-4 max-[600px]:gap-3">
      <div className="pointer-events-auto hidden text-center [@media(pointer:coarse)]:block">
        <div
          className="relative grid size-40 touch-none place-items-center rounded-full border-4 border-cream bg-[#d4edcfbb] shadow-[inset_0_0_0_12px_#ffffff40,0_5px_0_#345d3826] select-none"
          data-testid="joystick"
          aria-label="Dra för att gå"
          onPointerDown={(e) => {
            if (active.current !== null) return;
            active.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            move(e);
          }}
          onPointerMove={move}
          onPointerUp={(e) => {
            if (active.current === e.pointerId) reset();
          }}
          onPointerCancel={(e) => {
            if (active.current === e.pointerId) reset();
          }}
          onLostPointerCapture={(e) => {
            if (active.current === e.pointerId) reset();
          }}
        >
          <span className="text-[70px] font-extralight text-[#eff1da]">+</span>
          <div
            className="pointer-events-none absolute grid size-[76px] place-items-center rounded-full bg-cream text-forest shadow-[0_5px_0_#345d3844] [&_svg]:size-9"
            style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
          >
            <Footprints size={23} />
          </div>
        </div>
        <span className="mt-2 block rounded-xl bg-[#fffbeeec] text-lg font-extrabold text-ink">
          Dra för att gå
        </span>
      </div>
      {(!state.location || state.target) && (
        <button
          className="cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none pointer-events-auto flex min-h-[88px] max-w-[310px] items-center gap-3.5 rounded-[28px] border-[3px] border-white bg-sunshine p-4 text-2xl text-ink shadow-[0_6px_0_#a8782c] disabled:bg-[#fffbeed9] disabled:text-[#546a5c] disabled:shadow-none [&_svg]:size-9 [&_kbd]:rounded-lg [&_kbd]:border-2 [&_kbd]:border-[#a8782c] [&_kbd]:px-2 [&_kbd]:py-1 [&_kbd]:text-base [@media(pointer:coarse)]:mb-7 [@media(pointer:coarse)]:[&_kbd]:hidden max-[600px]:max-w-[180px] max-[600px]:gap-1.5 max-[600px]:p-2.5 max-[600px]:text-xl"
          onClick={() => {
            gameStore.interact();
            if (document.activeElement instanceof HTMLElement)
              document.activeElement.blur();
          }}
          disabled={!state.target || !!state.motion}
        >
          <span className="grid size-12 shrink-0 place-items-center max-[600px]:w-8">
            {state.target === "npc" ? (
              <MessageCircle size={23} />
            ) : typeof state.target === "object" &&
              state.target?.kind === "chest" ? (
              <LockKeyhole size={23} />
            ) : (
              <Hand size={23} />
            )}
          </span>
          <span className="min-w-0 break-words text-left">
            {typeof state.target === "object" && state.target
              ? state.target.kind === "chest"
                ? state.chests[state.target.id]
                  ? "Titta i kistan"
                  : "Öppna"
                : state.target.label
              : state.target === "bokoblin"
                ? hasBridgeEquipment(state)
                  ? "Skräm iväg"
                  : "Bokoblin"
                : state.target === "npc"
                  ? "Prata"
                  : "Gå och leta"}
          </span>
          <kbd>E</kbd>
        </button>
      )}
    </div>
  );
}
