import { SoundButton } from "./SoundButton";
import { Sword, Shield } from "lucide-react";
import { ArrowRight, Sprout, RotateCcw, Play, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { MouseEvent, ReactNode } from "react";
import { ReadAloudButton } from "./ReadAloudButton";
import { StoryPicture } from "./StoryPicture";
import { gameStore, useGameState } from "../store/gameStore";

export const buttonBase =
  "cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none";
export const primaryButton =
  "cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none flex min-h-[76px] w-full items-center justify-center gap-3.5 rounded-3xl bg-forest p-4 text-2xl text-white shadow-[0_5px_0_#22603b] [&_svg]:size-[30px]";
export const eyebrow =
  "mx-[58px]! mt-1! mb-2.5! text-xl! font-extrabold text-teal [@media(max-height:850px)]:grid [@media(max-height:850px)]:min-h-12 [@media(max-height:850px)]:place-items-center";
export const emblem =
  "mx-auto mb-3 grid h-[108px] w-[120px] place-items-center rounded-[32px] bg-[#fff0b8] text-forest [&>svg]:size-14";
// Same insets, corner and lift as the action button in TouchControls, so a dialog
// button lands on the pixels the thumb already rests on: centered with a mouse,
// bottom right on touch. Keep the two in sync.
export const cornerActionBar =
  "pointer-events-none absolute right-[max(24px,env(safe-area-inset-right))] bottom-[max(20px,env(safe-area-inset-bottom))] left-[max(24px,env(safe-area-inset-left))] flex flex-col-reverse items-center gap-3 [@media(pointer:coarse)]:mb-7 [@media(pointer:coarse)]:items-end max-[600px]:right-4 max-[600px]:left-4";
export const cornerAction = `${buttonBase} pointer-events-auto flex min-h-[88px] min-w-[220px] max-w-[310px] items-center justify-center gap-3.5 rounded-[28px] border-[3px] border-white bg-forest p-4 text-2xl text-white shadow-[0_6px_0_#22603b] [&_svg]:size-9 max-[600px]:min-w-0 max-[600px]:max-w-[240px] max-[600px]:gap-2 max-[600px]:p-3 max-[600px]:text-xl`;
export const cornerSecondary = `${buttonBase} pointer-events-auto flex min-h-16 max-w-[310px] items-center justify-center gap-3 rounded-[22px] border-[3px] border-white bg-[#e8efdc] px-5 py-3 text-[21px] text-ink shadow-[0_5px_0_#c3cdb4] [&_svg]:size-7`;
// A touch that lifts produces a compatibility click on whatever now sits under
// the finger, and the corner action shares its spot with the in-world action
// button. So only honour a click this button itself saw the pointer go down on
// (a keyboard press reports detail 0 and has no pointer at all).
export function CornerAction({
  onActivate,
  className = cornerAction,
  children,
}: {
  onActivate: () => void;
  className?: string;
  children: ReactNode;
}) {
  const primed = useRef(false);
  return (
    <button
      className={className}
      onPointerDown={() => {
        primed.current = true;
      }}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        const own = event.detail === 0 || primed.current;
        primed.current = false;
        if (own) onActivate();
      }}
    >
      {children}
    </button>
  );
}
export function Modal({
  children,
  label,
  action,
  actionRows = 1,
  className = "",
}: {
  children: ReactNode;
  label: string;
  action?: ReactNode;
  actionRows?: 1 | 2;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current
      ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus();
    return () => {
      previous?.blur();
    };
  }, []);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="absolute inset-0 z-10 bg-[#223c4666] backdrop-blur-sm"
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
      {/* The corner button lives outside this scrolling layer, which also
          reserves room so a tall dialog never hides behind the button. */}
      <div
        className={`absolute inset-0 grid place-items-center overflow-auto pt-[max(18px,env(safe-area-inset-top))] pr-[max(18px,env(safe-area-inset-right))] pl-[max(18px,env(safe-area-inset-left))] ${
          action
            ? actionRows === 2
              ? "pb-[calc(208px+max(20px,env(safe-area-inset-bottom)))]"
              : "pb-[calc(132px+max(20px,env(safe-area-inset-bottom)))]"
            : "pb-[max(18px,env(safe-area-inset-bottom))]"
        }`}
      >
        <div
          data-testid="dialog-panel"
          className={`relative max-h-full w-full max-w-[600px] overflow-auto rounded-[36px] border-4 border-white bg-cream px-8 pt-[26px] pb-[30px] text-center text-ink shadow-[0_16px_0_#233b3620,0_24px_80px_#20393344] [&>h2]:my-3.5 [&>h2]:text-[38px] [&>h2]:leading-[1.15] [&>h2]:font-black [&>p]:mt-3 [&>p]:mb-[22px] [&>p]:text-[23px] [&>p]:leading-[1.45] max-[600px]:rounded-[28px] max-[600px]:px-[18px] max-[600px]:py-[22px] max-[600px]:[&>h2]:text-[32px] max-[600px]:[&>p]:text-[21px] ${className}`}
        >
          <ReadAloudButton dialog={ref} />
          {children}
        </div>
      </div>
      {action && (
        <div data-testid="dialog-action" className={cornerActionBar}>
          {action}
        </div>
      )}
    </div>
  );
}
export function Dialogue() {
  const { overlay } = useGameState();
  if (
    !overlay ||
    overlay === "quiz" ||
    overlay === "inventory" ||
    overlay === "itemReward" ||
    overlay === "debug"
  )
    return null;
  if (overlay === "bokoblin")
    return (
      <Modal
        label="Bokoblin"
        action={
          <CornerAction onActivate={() => gameStore.close()}>
            Okej!
            <ArrowRight />
          </CornerAction>
        }
      >
        <div className="flex justify-center gap-6 text-forest">
          <Sword size={64} />
          <Shield size={64} />
        </div>
        <h2>Bokoblinen vaktar bron</h2>
        <p>Hitta svärdet och skölden i Vattentemplet!</p>
      </Modal>
    );
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
        {overlay === "pause" && <SoundButton />}
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
      action={
        <CornerAction
          onActivate={() =>
            overlay === "locked" ? gameStore.beginQuiz() : gameStore.close()
          }
        >
          {overlay === "locked"
            ? "Räkna!"
            : overlay === "npc"
              ? "Leta efter kistan"
              : "Spela vidare"}
          <ArrowRight />
        </CornerAction>
      }
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
          ? "Hej, Link!"
          : overlay === "locked"
            ? "Skattkistan är låst!"
            : "Du hittade skatten!"}
      </h2>
      <p>
        {overlay === "npc"
          ? "Följ de gröna rupees. Hitta kistan!"
          : overlay === "locked"
            ? "Räkna och samla tre stjärnor!"
            : "Kistan är tom nu. Leta efter stenporten!"}
      </p>
    </Modal>
  );
}
