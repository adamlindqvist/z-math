import { ArrowRight, Sprout, RotateCcw, Play, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { StoryPicture } from "./StoryPicture";
import { gameStore, useGameState } from "../store/gameStore";

const buttonBase =
  "cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none";
export const primaryButton =
  "cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none flex min-h-[76px] w-full items-center justify-center gap-3.5 rounded-3xl bg-forest p-4 text-2xl text-white shadow-[0_5px_0_#22603b] [&_svg]:size-[30px]";
export const eyebrow =
  "mx-[58px]! mt-1! mb-2.5! text-xl! font-extrabold text-teal [@media(max-height:850px)]:grid [@media(max-height:850px)]:min-h-12 [@media(max-height:850px)]:place-items-center";
export const emblem =
  "mx-auto mb-3 grid h-[108px] w-[120px] place-items-center rounded-[32px] bg-[#fff0b8] text-forest [&>svg]:size-14";
export function Modal({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      previous?.blur();
    };
  }, []);
  return (
    <div className="absolute inset-0 z-10 grid place-items-center overflow-auto bg-[#223c4666] pt-[max(18px,env(safe-area-inset-top))] pr-[max(18px,env(safe-area-inset-right))] pb-[max(18px,env(safe-area-inset-bottom))] pl-[max(18px,env(safe-area-inset-left))] backdrop-blur-sm">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative max-h-full w-full max-w-[600px] overflow-auto rounded-[36px] border-4 border-white bg-cream px-8 pt-[26px] pb-[30px] text-center text-ink shadow-[0_16px_0_#233b3620,0_24px_80px_#20393344] [&>h2]:my-3.5 [&>h2]:text-[38px] [&>h2]:leading-[1.15] [&>h2]:font-black [&>p]:mt-3 [&>p]:mb-[22px] [&>p]:text-[23px] [&>p]:leading-[1.45] max-[600px]:rounded-[28px] max-[600px]:px-[18px] max-[600px]:py-[22px] max-[600px]:[&>h2]:text-[32px] max-[600px]:[&>p]:text-[21px] ${className}`}
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const buttons = Array.from(
            ref.current?.querySelectorAll<HTMLButtonElement>(
              "button:not(:disabled)",
            ) ?? [],
          );
          if (!buttons.length) return;
          if (e.shiftKey && document.activeElement === buttons[0]) {
            e.preventDefault();
            buttons[buttons.length - 1].focus();
          } else if (
            !e.shiftKey &&
            document.activeElement === buttons[buttons.length - 1]
          ) {
            e.preventDefault();
            buttons[0].focus();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
export function Dialogue() {
  const { overlay } = useGameState();
  if (
    !overlay ||
    overlay === "quiz" ||
    overlay === "inventory" ||
    overlay === "itemReward"
  )
    return null;
  if (overlay === "pause" || overlay === "reset")
    return (
      <Modal label={overlay === "pause" ? "Paus" : "Börja om"}>
        <div className={emblem}>
          <Sprout size={32} />
        </div>

        <h2>{overlay === "pause" ? "En liten paus" : "Ett nytt äventyr?"}</h2>
        <p>
          {overlay === "pause"
            ? "Vi leker mer när du vill!"
            : "Alla dina skatter försvinner. Vill du börja om?"}
        </p>
        <button
          className={primaryButton}
          onClick={() =>
            overlay === "pause" ? gameStore.close() : gameStore.reset()
          }
        >
          {overlay === "pause" ? <Play size={20} /> : <RotateCcw size={20} />}{" "}
          {overlay === "pause" ? "Spela vidare" : "Ja, börja om"}
        </button>
        <button
          className={`${buttonBase} mt-4 min-h-16 w-full rounded-[20px] bg-[#e8efdc] text-[21px] text-ink`}
          onClick={() =>
            overlay === "pause"
              ? gameStore.confirmReset()
              : gameStore.cancelReset()
          }
        >
          {overlay === "pause" ? "Börja om" : "Nej, spela vidare"}
        </button>
      </Modal>
    );
  return (
    <Modal
      label={overlay === "npc" ? "Prata med Zelda" : "Skattkistan"}
      className=""
    >
      <button
        className={`${buttonBase} absolute top-3 right-3 grid size-16 place-items-center rounded-[22px] bg-[#e4eddd] text-ink [&_svg]:size-8`}
        aria-label="Stäng dialog"
        onClick={() => gameStore.close()}
      >
        <X size={20} />
      </button>
      <div className={`${emblem} bg-[#ede5e6]`}>
        {overlay === "npc" ? (
          <StoryPicture kind="princess" />
        ) : overlay === "locked" ? (
          <StoryPicture kind="chest" />
        ) : (
          <StoryPicture kind="chest" />
        )}
      </div>
      <h2>
        {overlay === "npc"
          ? "Hej, lilla äventyrare!"
          : overlay === "locked"
            ? "Skattkistan är låst!"
            : "Du hittade skatten!"}
      </h2>
      <p>
        {overlay === "npc"
          ? "Följ de gröna ädelstenarna. Hitta kistan!"
          : overlay === "locked"
            ? "Räkna och samla tre stjärnor!"
            : "Kistan är tom nu. Leta efter stenporten!"}
      </p>
      <button
        className={primaryButton}
        onClick={() =>
          overlay === "locked" ? gameStore.beginQuiz() : gameStore.close()
        }
      >
        {overlay === "locked"
          ? "Räkna!"
          : overlay === "npc"
            ? "Leta efter kistan"
            : "Spela vidare"}
        <ArrowRight size={20} />
      </button>
    </Modal>
  );
}
