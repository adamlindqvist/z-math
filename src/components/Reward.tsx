import { useEffect } from "react";
import { Gem, Sparkles } from "lucide-react";
import { gameStore, useGameState } from "../store/gameStore";
export function Reward() {
  const { reward } = useGameState();
  useEffect(() => {
    if (reward) {
      const timer = setTimeout(() => gameStore.clearReward(), 4200);
      return () => clearTimeout(timer);
    }
  }, [reward]);
  return reward ? (
    <div
      className="absolute top-[max(180px,calc(env(safe-area-inset-top)+160px))] left-1/2 z-8 flex w-max max-w-[calc(100%-40px)] -translate-x-1/2 items-center gap-[18px] rounded-[30px] border-4 border-white bg-[#fff0b8] p-[22px] text-ink shadow-[0_8px_0_#a8782c33] [&_strong]:text-[28px] [&_p]:text-[22px] [&>svg]:size-11 [&>svg]:shrink-0 [&>svg]:text-teal max-[600px]:gap-2.5 max-[600px]:p-4 max-[600px]:[&_strong]:text-[23px] max-[600px]:[&_p]:text-[19px]"
      role="status"
    >
      <span className="rounded-[14px] bg-[#f8e6a7] p-2.5 text-[#c79834]">
        <Gem size={30} />
      </span>
      <div>
        <strong>Skatten är din!</strong>
        <p>+{reward} ädelstenar · Bra jobbat!</p>
      </div>
      <Sparkles size={24} />
    </div>
  ) : null;
}
