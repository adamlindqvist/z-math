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
    <div className="reward-toast" role="status">
      <span className="reward-icon">
        <Coins size={30} />
      </span>
      <div>
        <strong>Skatten är din!</strong>
        <p>+{reward} mynt · Så fint räknat!</p>
      </div>
      <Sparkles size={24} />
    </div>
  ) : null;
}
