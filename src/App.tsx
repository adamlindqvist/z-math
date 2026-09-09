import { ShopDialog } from "./components/Shop";
import { connectSound } from "./audio/connectSound";
import { sound } from "./audio/sound";
import { InventoryDialog } from "./components/Inventory";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Game } from "./game/Game";
import { HUD } from "./components/HUD";
import { TouchControls } from "./components/TouchControls";
import { Dialogue } from "./components/Dialogue";
import { MathQuiz } from "./components/MathQuiz";
import { Reward } from "./components/Reward";

const DebugMenu = import.meta.env.DEV
  ? lazy(() => import("./components/DebugMenu"))
  : null;
export default function App() {
  const container = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const [error, setError] = useState("");
  useEffect(connectSound, []);
  useEffect(() => {
    sound.block("graphics", !!error);
  }, [error]);
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
      <section
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_48%_40%,#e9eed8_0%,#e0e6cb_47%,#d4dec0_100%)]"
        aria-label="Spelvärld"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_10%,#fff9dd66,transparent_70%)]" />
        <div
          className="absolute inset-0 [&_canvas]:block [&_canvas]:touch-none"
          ref={container}
        />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_#6c805415]" />
      </section>
      {error ? (
        <div
          className="absolute inset-0 z-10 grid place-items-center overflow-auto bg-[#223c4666] pt-[max(18px,env(safe-area-inset-top))] pr-[max(18px,env(safe-area-inset-right))] pb-[max(18px,env(safe-area-inset-bottom))] pl-[max(18px,env(safe-area-inset-left))] backdrop-blur-sm"
          role="alert"
        >
          <div className="relative max-h-full w-full max-w-[600px] overflow-auto rounded-[36px] border-4 border-white bg-cream px-8 pt-[26px] pb-[30px] text-center text-ink shadow-[0_16px_0_#233b3620,0_24px_80px_#20393344] [&>h2]:my-3.5 [&>h2]:text-[38px] [&>h2]:leading-[1.15] [&>h2]:font-black [&>p]:mt-3 [&>p]:mb-[22px] [&>p]:text-[23px] [&>p]:leading-[1.45] max-[600px]:rounded-[28px] max-[600px]:px-[18px] max-[600px]:py-[22px] max-[600px]:[&>h2]:text-[32px] max-[600px]:[&>p]:text-[21px]">
            <h2>Vi kunde inte visa gläntan</h2>
            <p className="my-5">{error}</p>
            <button
              className="cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none flex min-h-[76px] w-full items-center justify-center gap-3.5 rounded-3xl bg-forest p-4 text-2xl text-white shadow-[0_5px_0_#22603b] [&_svg]:size-[30px]"
              onClick={() => location.reload()}
            >
              Ladda om
            </button>
          </div>
        </div>
      ) : (
        <>
          <TouchControls game={game} />
          <Dialogue />
          <InventoryDialog />
          <ShopDialog />
          <MathQuiz />
          <Reward />
          {DebugMenu && (
            <Suspense fallback={null}>
              <DebugMenu />
            </Suspense>
          )}
        </>
      )}
    </main>
  );
}
