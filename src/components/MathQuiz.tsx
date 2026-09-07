import { Fragment } from "react";
import { resolveRoom } from "../game/dungeons/definitions";
import { useEffect } from "react";
import { LockKeyhole, Sparkles, Star, X, Check, Heart } from "lucide-react";
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
    <Modal
      label={title}
      className="[@media(max-height:850px)]:pt-[18px] [@media(max-height:850px)]:pb-5 [@media(max-height:850px)]:[&>p]:mt-2.5 [@media(max-height:850px)]:[&>p]:mb-4"
    >
      <button
        className="cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none absolute top-3 right-3 grid size-16 place-items-center rounded-[22px] bg-[#e4eddd] text-ink [&_svg]:size-8"
        aria-label="Försök senare"
        disabled={feedback === "correct" || feedback === "complete"}
        onClick={() => gameStore.close()}
      >
        <X size={20} />
      </button>
      <div
        className={`${emblem} h-16! w-[76px]! mb-1! [&>svg]:size-10! [@media(max-height:850px)]:hidden ${feedback === "correct" || feedback === "complete" ? "scale-110 rotate-3" : ""}`}
      >
        {feedback === "correct" || feedback === "complete" ? (
          <Sparkles size={32} />
        ) : (
          <LockKeyhole size={32} />
        )}
      </div>
      <p className={eyebrow}>{title}</p>
      <div
        className="my-3 flex justify-center gap-3 [&_svg]:size-[38px]"
        aria-label={`${quizCorrectAnswers} av ${required} rätt`}
      >
        {Array.from({ length: required }, (_, index) => (
          <Star
            key={index}
            aria-hidden="true"
            className={
              index < quizCorrectAnswers
                ? "text-[#bc7b09] motion-safe:animate-star-pop"
                : "text-[#998f71]"
            }
            fill={index < quizCorrectAnswers ? "currentColor" : "none"}
          />
        ))}
      </div>
      <h2 className="my-3.5! text-[44px]! max-[600px]:text-[36px]!">
        {question.question}
      </h2>
      {question.groups && (
        <div
          className="my-3 flex items-center justify-center gap-3"
          aria-label="Bilder att räkna"
        >
          {question.groups.map((count, group) => (
            <Fragment key={group}>
              {group > 0 && (
                <span className="text-3xl" aria-label="plus">
                  +
                </span>
              )}
              <div className="flex max-w-60 flex-wrap justify-center gap-2 rounded-[22px] bg-[#fff0be] p-3 max-[600px]:gap-1 max-[600px]:p-2 max-[600px]:[&_svg]:size-8">
                {Array.from({ length: count }, (_, i) => (
                  <Star
                    key={i}
                    size={40}
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
      <p>{challenge ? "Tryck på rätt antal." : "Tryck på rätt svar."}</p>
      <div
        className={`grid gap-4 max-[600px]:gap-2.5 ${question.answerDots ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {question.answers.map((answer) => (
          <button
            key={answer}
            data-testid="answer"
            className={`cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none min-h-24 rounded-3xl border-[3px] border-[#56a7a2] bg-[#e6f6ef] p-2.5 text-[40px] text-ink shadow-[0_5px_0_#b0d8c7] max-[600px]:text-[34px] ${(feedback === "correct" || feedback === "complete") && answer === question.correctAnswer ? "border-[#448036]! bg-[#d5ef9e]!" : ""}`}
            disabled={feedback === "correct" || feedback === "complete"}
            onClick={() => gameStore.answer(answer)}
          >
            {answer}
            {question.answerDots && (
              <span
                className="mx-auto my-1 flex max-w-[100px] flex-wrap justify-center gap-1.5"
                aria-hidden="true"
              >
                {Array.from({ length: answer }, (_, i) => (
                  <span key={i} className="size-3.5 rounded-full bg-current" />
                ))}
              </span>
            )}
          </button>
        ))}
      </div>
      <div
        className={`mt-[18px] flex min-h-12 items-center justify-center gap-2.5 text-[22px] font-bold [&_svg]:size-[30px] [&_svg]:shrink-0 ${feedback === "correct" || feedback === "complete" ? "text-[#286b3d] motion-safe:animate-star-pop" : ""}`}
        aria-live="polite"
      >
        {feedback === "retry" ? (
          <Heart aria-hidden="true" />
        ) : feedback ? (
          <Check aria-hidden="true" />
        ) : null}
        {feedback === "complete"
          ? challenge
            ? challenge.reward
              ? "Rätt! Skatten är din!"
              : "Rätt! Porten är öppen!"
            : "Tre rätt! Skatten är din!"
          : feedback === "correct"
            ? "Bra jobbat!"
            : feedback === "retry"
              ? "Prova igen!"
              : "Räkna gärna på fingrarna."}
      </div>
    </Modal>
  );
}
