import { Fragment, useState } from "react";
import { resolveRoom } from "../game/dungeons/definitions";
import { useEffect } from "react";
import {
  Apple,
  LockKeyhole,
  Sparkles,
  Star,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  gameStore,
  REQUIRED_CORRECT_ANSWERS,
  useGameState,
} from "../store/gameStore";
import { Modal, emblem } from "./Dialogue";
export function MathQuiz() {
  const {
    overlay,
    question,
    feedback,
    quizCorrectAnswers,
    location,
    dungeonQuiz,
  } = useGameState();
  const [selection, setSelection] = useState<{
    question: typeof question;
    answer: number;
  } | null>(null);
  const isCorrect = feedback === "correct" || feedback === "complete";
  const retryAnswer =
    feedback === "retry" && selection?.question === question
      ? selection.answer
      : null;
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
                  <Apple
                    key={i}
                    size={40}
                    fill="#e77b62"
                    className="text-[#9f3f2d]"
                    aria-label="Äpple"
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
            className={`cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none relative min-h-24 rounded-3xl border-[3px] border-[#56a7a2] bg-[#e6f6ef] p-2.5 text-[40px] text-ink shadow-[0_5px_0_#b0d8c7] max-[600px]:text-[34px] ${(feedback === "correct" || feedback === "complete") && answer === question.correctAnswer ? "border-[#286b3d]! bg-[#d5ef9e]! text-[#20552f]!" : answer === retryAnswer ? "border-[#b65a24]! bg-[#fff0d6]! text-[#873e18]!" : ""}`}
            disabled={feedback === "correct" || feedback === "complete"}
            aria-label={`${answer}${isCorrect && answer === question.correctAnswer ? ", rätt svar" : answer === retryAnswer ? ", inte rätt, prova igen" : ""}`}
            onClick={() => {
              setSelection({ question, answer });
              gameStore.answer(answer);
            }}
          >
            {isCorrect && answer === question.correctAnswer ? (
              <Check
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 size-7 rounded-full bg-[#286b3d] p-1 text-white motion-safe:animate-star-pop"
              />
            ) : answer === retryAnswer ? (
              <X
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 size-7 rounded-full bg-[#b65a24] p-1 text-white"
              />
            ) : null}
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
        className={`mt-4 flex min-h-20 items-center justify-center gap-3 rounded-3xl border-2 px-3 py-2 text-xl font-bold ${isCorrect ? "border-[#448036] bg-[#e0f3bd] text-[#20552f]" : feedback === "retry" ? "border-[#b65a24] bg-[#fff0d6] text-[#873e18]" : "border-transparent text-ink"}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback && (
          <span
            key={`${feedback}-${selection?.answer}`}
            className={`grid size-12 shrink-0 place-items-center rounded-full ${isCorrect ? "bg-[#286b3d] text-white motion-safe:animate-star-pop" : "bg-[#b65a24] text-white"}`}
          >
            {isCorrect ? (
              <Check size={34} aria-hidden="true" />
            ) : (
              <RotateCcw size={30} aria-hidden="true" />
            )}
          </span>
        )}
        <div>
          <div className={feedback ? "text-2xl font-extrabold" : ""}>
            {isCorrect
              ? "Rätt! Bra jobbat!"
              : feedback === "retry"
                ? "Inte rätt än. Prova igen!"
                : "Räkna gärna på fingrarna."}
          </div>
          {feedback === "complete" && (
            <div className="mt-0.5 text-lg">
              {challenge
                ? challenge.reward
                  ? "Skatten är din!"
                  : "Porten är öppen!"
                : "Tre rätt! Skatten är din!"}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
