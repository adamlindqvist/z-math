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
    <div className="game-controls">
      <div className="joystick-wrap">
        <div
          className="joystick"
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
          <span className="joystick-cross">+</span>
          <div
            className="joystick-knob"
            style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
          >
            <Footprints size={23} />
          </div>
        </div>
        <span>DRA FÖR ATT GÅ</span>
      </div>
      <button
        className={`interact-button ${state.target ? "available" : ""}`}
        onClick={() => {
          gameStore.interact();
          if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur();
        }}
        disabled={!state.target}
      >
        <span className="action-symbol">
          {state.target === "npc" ? (
            <MessageCircle size={23} />
          ) : state.target === "chest" ? (
            <LockKeyhole size={23} />
          ) : (
            <Hand size={23} />
          )}
        </span>
        <span>
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
