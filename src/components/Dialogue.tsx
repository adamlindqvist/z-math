import {
  ArrowRight,
  LockKeyhole,
  Sparkles,
  Sprout,
  RotateCcw,
  Play,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gameStore, useGameState } from "../store/gameStore";

const buttonBase = "cursor-pointer transition hover:brightness-[1.03] active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#d89743] disabled:cursor-default";
export const primaryButton = `${buttonBase} flex min-h-[57px] w-full items-center justify-center gap-3 rounded-[13px] border border-[#577c4b] bg-[#608454] p-3 text-sm font-bold text-[#fffdee] shadow-[0_4px_0_#4d6d42]`;
export const eyebrow = "mb-1.5 text-[9px] font-extrabold tracking-[1.6px] text-[#8d977b] max-[540px]:text-[7px] max-[540px]:tracking-[1.1px]";
export const emblem = "mx-auto mb-[21px] grid h-[69px] w-[69px] -rotate-5 place-items-center rounded-[23px] border-[5px] border-[#f3f3e5] bg-[#e9eed8] text-[#72945c] [&_svg]:rotate-5 max-[540px]:mb-4 max-[540px]:h-[59px] max-[540px]:w-[59px] [@media(max-height:620px)_and_(min-width:541px)]:hidden";
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
    <div className="absolute inset-0 z-10 grid place-items-center overflow-auto bg-[#30483022] p-[max(20px,env(safe-area-inset-top))] backdrop-blur-[3px] max-[540px]:p-[15px] [@media(max-height:620px)_and_(min-width:541px)]:p-3">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative w-full max-w-[430px] rounded-[26px] border border-[#fffff5] bg-[#fffbef] px-[34px] pt-[30px] pb-[27px] text-center shadow-[0_25px_85px_#30402c33] [&>h2]:my-3 [&>h2]:text-[29px] [&>h2]:leading-[1.2] [&>h2]:font-extrabold [&>h2]:tracking-[-1px] [&>p:not(.eyebrow)]:mb-[23px] [&>p:not(.eyebrow)]:text-sm [&>p:not(.eyebrow)]:leading-[1.8] [&>p:not(.eyebrow)]:text-[#87907b] max-[540px]:max-w-[360px] max-[540px]:rounded-[23px] max-[540px]:p-6 max-[540px]:[&>h2]:text-[27px] max-[540px]:[&>p:not(.eyebrow)]:text-[13px] [@media(max-height:620px)_and_(min-width:541px)]:max-w-[410px] [@media(max-height:620px)_and_(min-width:541px)]:px-7 [@media(max-height:620px)_and_(min-width:541px)]:py-[19px] [@media(max-height:620px)_and_(min-width:541px)]:[&>h2]:my-2 [@media(max-height:620px)_and_(min-width:541px)]:[&>h2]:text-2xl [@media(max-height:620px)_and_(min-width:541px)]:[&>p:not(.eyebrow)]:mb-[15px] [@media(max-height:620px)_and_(min-width:541px)]:[&>p:not(.eyebrow)]:text-xs ${className}`}
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
  if (!overlay || overlay === "quiz") return null;
  if (overlay === "welcome")
    return (
      <Modal label="Välkommen till Gläntan">
        <div className={emblem}>
          <Sprout size={36} />
        </div>
        <p className={eyebrow}>DITT ÄVENTYR BÖRJAR HÄR</p>
        <h2>
          En liten glänta.
          <br />
          En gömd skatt.
        </h2>
        <p>
          Följ stigen, träffa en vän och lås upp
          <br /> en hemlighet med lite matte.
        </p>
        <button className={primaryButton} onClick={() => gameStore.start()}>
          Nu går vi! <ArrowRight size={21} />
        </button>
        <span className="mt-[22px] block text-[10px] text-[#a4a68e] [@media(max-height:620px)_and_(min-width:541px)]:mt-3.5">Ingen brådska. Bara nyfikenhet.</span>
      </Modal>
    );
  if (overlay === "pause" || overlay === "reset")
    return (
      <Modal label={overlay === "pause" ? "Paus" : "Börja om"}>
        <div className={emblem}>
          <Sprout size={32} />
        </div>
        <p className={eyebrow}>EN LITEN VILOSTUND</p>
        <h2>
          {overlay === "pause" ? "Gläntan väntar på dig." : "Ett nytt äventyr?"}
        </h2>
        <p>
          {overlay === "pause"
            ? "Ta en paus. Skatten springer ingenstans."
            : "Dina mynt nollställs och kistan stängs."}
        </p>
        <button
          className={primaryButton}
          onClick={() =>
            overlay === "pause" ? gameStore.close() : gameStore.reset()
          }
        >
          {overlay === "pause" ? <Play size={20} /> : <RotateCcw size={20} />}{" "}
          {overlay === "pause" ? "Fortsätt äventyret" : "Ja, börja om"}
        </button>
        <button
          className={`${buttonBase} mt-[9px] block min-h-14 w-full border-0 bg-transparent text-[13px] text-[#879178]`}
          onClick={() =>
            overlay === "pause"
              ? gameStore.confirmReset()
              : gameStore.cancelReset()
          }
        >
          {overlay === "pause" ? "Börja om" : "Behåll mitt äventyr"}
        </button>
      </Modal>
    );
  return (
    <Modal
      label={overlay === "npc" ? "Prata med Maja" : "Skattkistan"}
      className=""
    >
      <button
        className={`${buttonBase} absolute top-[9px] right-[9px] grid h-14 w-14 place-items-center rounded-xl border-0 bg-transparent text-[#8c947c]`}
        aria-label="Stäng dialog"
        onClick={() => gameStore.close()}
      >
        <X size={20} />
      </button>
      <div className={`${emblem} bg-[#ede5e6]`}>
        {overlay === "npc" ? (
          <span className="rotate-5 font-serif text-4xl text-[#a27899]">M</span>
        ) : overlay === "locked" ? (
          <LockKeyhole size={32} />
        ) : (
          <Sparkles size={32} />
        )}
      </div>
      <p className={eyebrow}>
        {overlay === "npc"
          ? "MAJA · GLÄNTANS TRÄDGÅRDSMÄSTARE"
          : "EN HEMLIGHET LÄNGS STIGEN"}
      </p>
      <h2>
        {overlay === "npc"
          ? "Hej, lilla äventyrare!"
          : overlay === "locked"
            ? "Skattkistan är låst!"
            : "Du hittade skatten!"}
      </h2>
      <p>
        {overlay === "npc"
          ? "En skatt väntar bortom dammen! Följ mynten längs stigen. Lite klurig matte är allt som behövs för att öppna kistan."
          : overlay === "locked"
            ? "Det här låset gillar siffror. Hjälper du till att räkna?"
            : "Kistan är tom nu, men det finns mer att upptäcka i gläntan. Har du hittat alla mynt?"}
      </p>
      <button
        className={primaryButton}
        onClick={() =>
          overlay === "locked" ? gameStore.beginQuiz() : gameStore.close()
        }
      >
        {overlay === "locked"
          ? "Lös mattelåset"
          : overlay === "npc"
            ? "Jag letar efter skatten!"
            : "Utforska vidare"}
        <ArrowRight size={20} />
      </button>
    </Modal>
  );
}
