import { RotateCcw, Check } from "lucide-react";
import { gameStore } from "../store/gameStore";
import { MINIBOSSES } from "../game/minibosses/definitions";
import type { MinibossEncounter } from "../game/minibosses/state";

export function MinibossHUD({ encounter }: { encounter: MinibossEncounter }) {
  const { phase, selected, status } = encounter;
  const target = MINIBOSSES[encounter.id].phases[phase];
  const equation =
    selected.length === 2
      ? `${selected[0]} + ${selected[1]} = ${selected[0] + selected[1]}${status === "success" ? "!" : ""}`
      : `${selected[0] ?? "?"} + ? = ${target}`;
  return (
    <section
      className="pointer-events-auto max-w-[330px] rounded-3xl border-[3px] border-[#ffd79b] bg-[#362e3ef2] p-3 text-[#fff1c6] shadow-lg max-[600px]:p-2"
      aria-label="Stenjättens runa"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-base font-extrabold">Stenjätten</span>
        <span
          className="flex gap-1.5"
          aria-label={`${phase + (status === "success" || status === "collapsing" ? 1 : 0)} av 3 runor lösta`}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`grid size-6 place-items-center rounded-full border-2 ${i < phase || (i === phase && (status === "success" || status === "collapsing")) ? "border-[#b4f4d5] bg-[#b4f4d5] text-[#243b38]" : "border-[#d3aa78]"}`}
            >
              {(i < phase ||
                (i === phase &&
                  (status === "success" || status === "collapsing"))) && (
                <Check size={17} />
              )}
            </span>
          ))}
        </span>
      </div>
      <div role="status" aria-live="polite" aria-atomic="true">
        <p className="mt-1 whitespace-nowrap text-[clamp(21px,3.2vw,36px)] leading-tight font-black tabular-nums">
          {equation}
        </p>
        <p className="mt-1 text-base font-bold">
          {status === "failure"
            ? "Prova igen"
            : status === "collapsing"
              ? "Du klarade det!"
              : status === "success"
                ? "Rätt!"
                : "Välj två stenar"}
        </p>
      </div>
      {status === "choosing" && selected.length > 0 && (
        <button
          className="mt-2 flex min-h-14 w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-2xl bg-[#ffe0a2] px-3 py-2 font-extrabold text-[#362e3e] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px"
          onClick={() => gameStore.resetRuneSelection()}
          aria-label="Ångra vald runsten"
        >
          <RotateCcw size={25} /> Ångra
        </button>
      )}
    </section>
  );
}
