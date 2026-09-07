import { Fragment } from "react";
import { resolveRoom } from "../game/dungeons/definitions";
import { useEffect } from "react";
import { LockKeyhole, Sparkles, Star, X } from "lucide-react";
import {
  gameStore,
  REQUIRED_CORRECT_ANSWERS,
  useGameState,
} from "../store/gameStore";
import { Modal, emblem, eyebrow } from "./Dialogue";
export function MathQuiz() {
  const {
    overlay,
    question,
    feedback,
    quizCorrectAnswers,
    location,
    dungeonQuiz,
  } = useGameState();
  const challenge = dungeonQuiz
    ? resolveRoom(location)?.room.challenge
    : undefined;
  const required = challenge?.required ?? REQUIRED_CORRECT_ANSWERS;
  const title = challenge?.title ?? "Kistans mattelås";
  useEffect(() => {
    if (feedback === "correct" || feedback === "complete") {
      const timer = setTimeout(() => gameStore.finishQuiz(), 1000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);
  if (overlay !== "quiz" || !question) return null;
  return (
    <Modal label={title} className="max-w-[450px]">
      <button
        className="absolute top-[9px] right-[9px] grid h-14 w-14 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-[#8c947c] transition hover:brightness-[1.03] active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#d89743] disabled:cursor-default"
        aria-label="Försök senare"
        disabled={feedback === "correct" || feedback === "complete"}
        onClick={() => gameStore.close()}
      >
        <X size={20} />
      </button>
      <div
        className={`${emblem} ${feedback === "correct" || feedback === "complete" ? "scale-110 rotate-3" : ""}`}
      >
        {feedback === "correct" || feedback === "complete" ? (
          <Sparkles size={32} />
        ) : (
          <LockKeyhole size={32} />
        )}
      </div>
      <p className={eyebrow}>{title}</p>
      <p aria-label={`${quizCorrectAnswers} av ${required} rätt`}>
        {Array.from({ length: required }, (_, index) =>
          index < quizCorrectAnswers ? "⭐" : "☆",
        ).join(" ")}
      </p>
      <h2
        className={`${question.groups ? "text-2xl! max-[540px]:text-2xl!" : "text-5xl! max-[540px]:text-[40px]!"} my-5! tracking-[1px]! text-[#465e40] [@media(max-height:620px)_and_(min-width:541px)]:my-2.5! [@media(max-height:620px)_and_(min-width:541px)]:text-3xl!`}
      >
        {question.question}
      </h2>
      {question.groups && (
        <div
          className="mb-5 flex items-center justify-center gap-3"
          aria-label="Bilder att räkna"
        >
          {question.groups.map((count, group) => (
            <Fragment key={group}>
              {group > 0 && (
                <span className="text-3xl" aria-label="plus">
                  +
                </span>
              )}
              <div className="flex max-w-40 flex-wrap justify-center gap-2 rounded-xl bg-[#f0eedb] p-3">
                {Array.from({ length: count }, (_, i) => (
                  <Star
                    key={i}
                    size={32}
                    fill="#ebbf57"
                    className="text-[#ac7e27]"
                    aria-label="Stjärna"
                  />
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      )}
      <p>
        {challenge
          ? "Räkna bilderna. Tryck på antalet."
          : "Få tre rätt för att öppna kistan!"}
      </p>
      <div
        className={`grid gap-3 ${question.answerDots ? "grid-cols-3" : "grid-cols-2 [@media(max-height:620px)_and_(min-width:541px)]:grid-cols-4"}`}
      >
        {question.answers.map((answer) => (
          <button
            key={answer}
            className={`answer-button min-h-[76px] cursor-pointer rounded-[15px] border-2 text-[28px] font-extrabold shadow-[0_4px_0_#e7e6d5] transition hover:border-[#b6c995] hover:bg-[#edf1dc] active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#d89743] disabled:cursor-default max-[540px]:min-h-16 [@media(max-height:620px)_and_(min-width:541px)]:min-h-[60px] ${(feedback === "correct" || feedback === "complete") && answer === question.correctAnswer ? "border-[#92b572] bg-[#dcefc4] text-[#4c763d]" : "border-[#e3e5d1] bg-[#f7f5e7] text-[#5f7250]"}`}
            disabled={feedback === "correct" || feedback === "complete"}
            onClick={() => gameStore.answer(answer)}
          >
            {answer}
            {question.answerDots && (
              <span
                className="mx-auto mt-1 flex max-w-16 flex-wrap justify-center gap-1 pb-2"
                aria-hidden="true"
              >
                {Array.from({ length: answer }, (_, i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full bg-current"
                  />
                ))}
              </span>
            )}
          </button>
        ))}
      </div>
      <div
        className={`mt-[22px] min-h-[25px] text-xs [@media(max-height:620px)_and_(min-width:541px)]:mt-[17px] ${feedback === "correct" || feedback === "complete" ? "font-extrabold text-[#628848]" : feedback === "retry" ? "text-[#a98045]" : "text-[#9c9e87]"}`}
        aria-live="polite"
      >
        {feedback === "complete"
          ? challenge
            ? challenge.reward
              ? "Rätt! Skatten är din!"
              : "Rätt! Porten är öppen!"
            : "Tre rätt! Skatten är din!"
          : feedback === "correct"
            ? "Helt rätt! En stjärna till!"
            : feedback === "retry"
              ? "Försök igen! Du kan ta det i din takt."
              : "Räkna gärna på fingrarna."}
      </div>
    </Modal>
  );
}
