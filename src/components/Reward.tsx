import { useEffect } from "react";
import { Gem } from "lucide-react";
import { gameStore, useGameState } from "../store/gameStore";
export function Reward() {
  const { reward, overlay } = useGameState();
  useEffect(() => {
    if (reward && overlay !== "itemReward") {
      const timer = setTimeout(() => gameStore.clearReward(), 4200);
      return () => clearTimeout(timer);
    }
  }, [reward, overlay]);
  return reward && overlay !== "itemReward" ? (
    <div
      className="pointer-events-none absolute top-[max(12px,env(safe-area-inset-top))] left-1/2 z-8 flex w-max max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2.5 rounded-2xl border-2 border-white bg-[#fff8dcf2] px-4 py-2.5 text-ink shadow-[0_4px_14px_#344e3030] backdrop-blur-sm max-[600px]:max-w-[calc(100%-24px)] max-[600px]:px-3 max-[600px]:py-2"
      role="status"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f8e6a7] text-[#a9741d]">
        <Gem size={22} aria-hidden="true" />
      </span>
      <p className="text-lg leading-tight whitespace-nowrap max-[600px]:text-base">
        <span className="font-bold text-[#536d5e]">
          Du fick +{reward} rupees
        </span>
      </p>
    </div>
  ) : null;
}
