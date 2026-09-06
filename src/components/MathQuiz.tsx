import { useEffect } from "react";
import { LockKeyhole, Sparkles, X } from "lucide-react";
import { gameStore, useGameState } from "../store/gameStore";
import { Modal } from "./Dialogue";
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
      className={`quiz-card ${feedback === "correct" ? "quiz-success" : ""}`}
    >
      <button
        className="close-button"
        aria-label="Försök senare"
        disabled={feedback === "correct"}
        onClick={() => gameStore.close()}
      >
        <X size={20} />
      </button>
      <div className="modal-emblem">
        {feedback === "correct" ? (
          <Sparkles size={32} />
        ) : (
          <LockKeyhole size={32} />
        )}
      </div>
      <p className="eyebrow">KISTANS MATTELÅS</p>
      <h2 className="math-question">{question.question}</h2>
      <p>Vilket svar öppnar skatten?</p>
      <div className="answer-grid">
        {question.answers.map((answer) => (
          <button
            key={answer}
            className={`answer-button ${feedback === "correct" && answer === question.correctAnswer ? "correct-answer" : ""}`}
            disabled={feedback === "correct"}
            onClick={() => gameStore.answer(answer)}
          >
            {answer}
          </button>
        ))}
      </div>
      <div className={`quiz-feedback ${feedback || ""}`} aria-live="polite">
        {feedback === "correct"
          ? "Helt rätt! Skatten är din!"
          : feedback === "retry"
            ? "Försök igen! Du kan ta det i din takt."
            : "Räkna gärna på fingrarna."}
      </div>
    </Modal>
  );
}
