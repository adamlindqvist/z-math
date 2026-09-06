import { useEffect } from "react";
import { Coins, Sparkles } from "lucide-react";
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
    <div className="absolute top-[145px] left-1/2 z-8 flex -translate-x-1/2 items-center gap-4 whitespace-nowrap rounded-[19px] border border-white bg-[#fffae9] px-[23px] py-[17px] text-[#91a074] shadow-[0_9px_30px_#4f673f25] max-[540px]:top-[115px] max-[540px]:gap-2.5 max-[540px]:px-[15px] max-[540px]:py-[13px] max-[540px]:[&>svg]:hidden [@media(max-height:620px)_and_(min-width:541px)]:top-[100px]" role="status">
      <span className="rounded-[14px] bg-[#f8e6a7] p-2.5 text-[#c79834]">
        <Coins size={30} />
      </span>
      <div>
        <strong className="text-[17px] text-[#546647] max-[540px]:text-[15px]">Skatten är din!</strong>
        <p className="mt-1 text-xs text-[#8e9678]">+{reward} mynt · Så fint räknat!</p>
      </div>
      <Sparkles size={24} />
    </div>
  ) : null;
}
