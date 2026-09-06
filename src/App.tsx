import { useEffect, useRef, useState } from "react";
import { Game } from "./game/Game";
import { HUD } from "./components/HUD";
import { TouchControls } from "./components/TouchControls";
import { Dialogue } from "./components/Dialogue";
import { MathQuiz } from "./components/MathQuiz";
import { Reward } from "./components/Reward";
export default function App() {
  const container = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!container.current) return;
    try {
      game.current = new Game(container.current, setError);
    } catch {
      setError(
        "Gläntan behöver 3D-grafik. Prova att ladda om sidan i en webbläsare med WebGL.",
      );
    }
    return () => {
      game.current?.dispose();
      game.current = null;
    };
  }, []);
  return (
    <main className="app-shell">
      <HUD />
      <section className="landscape" aria-label="Spelvärld">
        <div className="sun-haze" />
        <div className="game-canvas" ref={container} />
        <div className="scene-vignette" />
      </section>
      {error ? (
        <div className="error-message" role="alert">
          <h2>Vi kunde inte visa gläntan</h2>
          <p>{error}</p>
          <button className="primary-button" onClick={() => location.reload()}>
            Ladda om
          </button>
        </div>
      ) : (
        <>
          <TouchControls game={game} />
          <Dialogue />
          <MathQuiz />
          <Reward />
        </>
      )}
    </main>
  );
}
