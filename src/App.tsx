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
    <main className="relative h-dvh min-h-[360px] overflow-hidden bg-[#f6f3e9] font-sans font-medium text-[#344739] antialiased">
      <HUD />
      <section className="absolute inset-0 bg-[radial-gradient(ellipse_at_48%_40%,#e9eed8_0%,#e0e6cb_47%,#d4dec0_100%)]" aria-label="Spelvärld">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_10%,#fff9dd66,transparent_70%)]" />
        <div className="absolute inset-0 [&_canvas]:block [&_canvas]:touch-none" ref={container} />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_#6c805415]" />
      </section>
      {error ? (
        <div className="absolute inset-[25%_20%] z-20 rounded-[20px] bg-[#fffaec] p-[30px] text-center" role="alert">
          <h2 className="text-2xl font-bold">Vi kunde inte visa gläntan</h2>
          <p className="my-5">{error}</p>
          <button className="flex min-h-[57px] w-full cursor-pointer items-center justify-center gap-3 rounded-[13px] border border-[#577c4b] bg-[#608454] p-3 text-sm font-bold text-[#fffdee] shadow-[0_4px_0_#4d6d42] transition hover:brightness-[1.03] active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#d89743]" onClick={() => location.reload()}>
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
