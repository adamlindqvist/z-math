import { useEffect } from "react";
import { LockKeyhole, Sparkles, X } from "lucide-react";
import { gameStore, useGameState } from "../store/gameStore";
import { Modal, emblem, eyebrow } from "./Dialogue";
export function MathQuiz() {
  const { overlay, question, feedback } = useGameState();
  useEffect(() => {
    if (feedback === "correct") {
      const timer = setTimeout(() => gameStore.finishQuiz(), 1000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);
  if (overlay !== "quiz" || !question) return null;
  return (
    <Modal
      label="Kistans mattelås"
      className="max-w-[450px]"
    >
      <button
        className="absolute top-[9px] right-[9px] grid h-14 w-14 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-[#8c947c] transition hover:brightness-[1.03] active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#d89743] disabled:cursor-default"
        aria-label="Försök senare"
        disabled={feedback === "correct"}
        onClick={() => gameStore.close()}
      >
        <X size={20} />
      </button>
      <div className={`${emblem} ${feedback === "correct" ? "scale-110 rotate-3" : ""}`}>
        {feedback === "correct" ? (
          <Sparkles size={32} />
        ) : (
          <LockKeyhole size={32} />
        )}
      </div>
      <p className={eyebrow}>KISTANS MATTELÅS</p>
      <h2 className="my-5! text-5xl! tracking-[1px]! text-[#465e40] max-[540px]:text-[40px]! [@media(max-height:620px)_and_(min-width:541px)]:my-2.5! [@media(max-height:620px)_and_(min-width:541px)]:text-4xl!">{question.question}</h2>
      <p>Vilket svar öppnar skatten?</p>
      <div className="grid grid-cols-2 gap-[13px] [@media(max-height:620px)_and_(min-width:541px)]:grid-cols-4 [@media(max-height:620px)_and_(min-width:541px)]:gap-[9px]">
        {question.answers.map((answer) => (
          <button
            key={answer}
            className={`answer-button min-h-[76px] cursor-pointer rounded-[15px] border-2 text-[28px] font-extrabold shadow-[0_4px_0_#e7e6d5] transition hover:border-[#b6c995] hover:bg-[#edf1dc] active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#d89743] disabled:cursor-default max-[540px]:min-h-16 [@media(max-height:620px)_and_(min-width:541px)]:min-h-[60px] ${feedback === "correct" && answer === question.correctAnswer ? "border-[#92b572] bg-[#dcefc4] text-[#4c763d]" : "border-[#e3e5d1] bg-[#f7f5e7] text-[#5f7250]"}`}
            disabled={feedback === "correct"}
            onClick={() => gameStore.answer(answer)}
          >
            {answer}
          </button>
        ))}
      </div>
      <div className={`mt-[22px] min-h-[25px] text-xs [@media(max-height:620px)_and_(min-width:541px)]:mt-[17px] ${feedback === "correct" ? "font-extrabold text-[#628848]" : feedback === "retry" ? "text-[#a98045]" : "text-[#9c9e87]"}`} aria-live="polite">
        {feedback === "correct"
          ? "Helt rätt! Skatten är din!"
          : feedback === "retry"
            ? "Försök igen! Du kan ta det i din takt."
            : "Räkna gärna på fingrarna."}
      </div>
    </Modal>
  );
}
