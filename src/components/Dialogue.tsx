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
    <div className="modal-backdrop">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`modal-card ${className}`}
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
      <Modal label="Välkommen till Gläntan" className="welcome-card">
        <div className="modal-emblem">
          <Sprout size={36} />
        </div>
        <p className="eyebrow">DITT ÄVENTYR BÖRJAR HÄR</p>
        <h2>
          En liten glänta.
          <br />
          En gömd skatt.
        </h2>
        <p>
          Följ stigen, träffa en vän och lås upp
          <br className="desktop-break" /> en hemlighet med lite matte.
        </p>
        <button className="primary-button" onClick={() => gameStore.start()}>
          Nu går vi! <ArrowRight size={21} />
        </button>
        <span className="modal-footnote">Ingen brådska. Bara nyfikenhet.</span>
      </Modal>
    );
  if (overlay === "pause" || overlay === "reset")
    return (
      <Modal label={overlay === "pause" ? "Paus" : "Börja om"}>
        <div className="modal-emblem">
          <Sprout size={32} />
        </div>
        <p className="eyebrow">EN LITEN VILOSTUND</p>
        <h2>
          {overlay === "pause" ? "Gläntan väntar på dig." : "Ett nytt äventyr?"}
        </h2>
        <p>
          {overlay === "pause"
            ? "Ta en paus. Skatten springer ingenstans."
            : "Dina mynt nollställs och kistan stängs."}
        </p>
        <button
          className="primary-button"
          onClick={() =>
            overlay === "pause" ? gameStore.close() : gameStore.reset()
          }
        >
          {overlay === "pause" ? <Play size={20} /> : <RotateCcw size={20} />}{" "}
          {overlay === "pause" ? "Fortsätt äventyret" : "Ja, börja om"}
        </button>
        <button
          className="secondary-button"
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
      className="dialogue-card"
    >
      <button
        className="close-button"
        aria-label="Stäng dialog"
        onClick={() => gameStore.close()}
      >
        <X size={20} />
      </button>
      <div className="modal-emblem">
        {overlay === "npc" ? (
          <span className="maja-avatar">M</span>
        ) : overlay === "locked" ? (
          <LockKeyhole size={32} />
        ) : (
          <Sparkles size={32} />
        )}
      </div>
      <p className="eyebrow">
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
        className="primary-button"
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
