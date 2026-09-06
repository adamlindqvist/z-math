import { useRef, useState } from "react";
import type { RefObject, PointerEvent } from "react";
import { Hand, MessageCircle, LockKeyhole, Footprints } from "lucide-react";
import type { Game } from "../game/Game";
import { gameStore, useGameState } from "../store/gameStore";
export function TouchControls({ game }: { game: RefObject<Game | null> }) {
  const state = useGameState();
  const active = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const reset = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    if (game.current) game.current.input.touch = { x: 0, y: 0 };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (active.current !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left - rect.width / 2,
      y = e.clientY - rect.top - rect.height / 2;
    const d = Math.hypot(x, y);
    if (d > 39) {
      x = (x / d) * 39;
      y = (y / d) * 39;
    }
    setKnob({ x, y });
    if (game.current) game.current.input.touch = { x: x / 39, y: y / 39 };
  };
  if (state.overlay) return null;
  return (
    <div className="pointer-events-none absolute inset-x-[35px] bottom-[max(24px,env(safe-area-inset-bottom))] z-6 flex items-end justify-center px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] max-[850px]:inset-x-[25px] max-[540px]:inset-x-5 [@media(pointer:coarse)]:justify-between">
      <div className="pointer-events-auto hidden text-center [@media(pointer:coarse)]:block">
        <div
          className="joystick relative grid h-[126px] w-[126px] touch-none select-none place-items-center rounded-full border border-[#fffbdfb0] bg-[#f9f7e660] shadow-[inset_0_0_0_12px_#ffffff20,0_3px_15px_#4a68341a] backdrop-blur-[5px] [@media(max-height:620px)_and_(min-width:541px)]:h-[108px] [@media(max-height:620px)_and_(min-width:541px)]:w-[108px]"
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
            className="pointer-events-none absolute grid h-[57px] w-[57px] place-items-center rounded-full bg-[#faf7e9] text-[#8a9977] shadow-[0_4px_8px_#49643b22]"
            style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
          >
            <Footprints size={23} />
          </div>
        </div>
        <span className="mt-2.5 block text-[8px] font-extrabold tracking-[1.6px] text-[#7a8a67]">DRA FÖR ATT GÅ</span>
      </div>
      <button
        className={`pointer-events-auto flex min-h-[58px] cursor-pointer items-center gap-3 rounded-[18px] border border-[#fffced] px-[17px] py-2 pl-[9px] text-xs shadow-[0_5px_17px_#54683910] backdrop-blur-lg transition hover:brightness-[1.03] active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#d89743] disabled:cursor-default max-[540px]:max-w-[177px] max-[540px]:gap-2 max-[540px]:rounded-2xl max-[540px]:p-2 max-[540px]:text-[11px] [&>kbd]:ml-3 [&>kbd]:grid [&>kbd]:h-7 [&>kbd]:min-w-[27px] [&>kbd]:place-items-center [&>kbd]:rounded-[5px] [&>kbd]:border [&>kbd]:border-[#dddcca] [&>kbd]:bg-[#fffcf3] [&>kbd]:text-[10px] [&>kbd]:text-[#7b856e] [&>kbd]:shadow-[0_2px_0_#e8e5d7] max-[540px]:[&>kbd]:hidden [@media(pointer:coarse)]:mb-[26px] [@media(pointer:coarse)]:min-h-[66px] [@media(pointer:coarse)]:[&>kbd]:hidden ${state.target ? "bg-[#faf8e9] text-[#496843] shadow-[0_5px_20px_#4d673b25]" : "bg-[#fbf9edce] text-[#8e9a7d] [@media(pointer:coarse)]:max-w-[180px]"}`}
        onClick={() => {
          gameStore.interact();
          if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur();
        }}
        disabled={!state.target}
      >
        <span className="grid h-[39px] w-[39px] place-items-center rounded-xl bg-[#e6ebd6] max-[540px]:h-[34px] max-[540px]:min-w-[34px]">
          {state.target === "npc" ? (
            <MessageCircle size={23} />
          ) : state.target === "chest" ? (
            <LockKeyhole size={23} />
          ) : (
            <Hand size={23} />
          )}
        </span>
        <span className="[@media(pointer:coarse)]:max-w-[130px] [@media(pointer:coarse)]:text-left">
          {state.target === "npc"
            ? "Prata med Maja"
            : state.target === "chest"
              ? state.chestOpened
                ? "Undersök kistan"
                : "Öppna kistan"
              : "Hitta något att upptäcka"}
        </span>
        <kbd>E</kbd>
      </button>
    </div>
  );
}
