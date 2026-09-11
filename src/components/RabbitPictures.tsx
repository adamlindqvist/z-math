import { Rabbit } from "lucide-react";
import { RABBITS, type RabbitProgress } from "../game/rabbits/definitions";
export function RabbitPictures({ rabbits }: { rabbits: RabbitProgress }) {
  return <span className="flex justify-center gap-3" aria-label={`${RABBITS.filter(r => rabbits[r.id]).length} av 3 kaniner hemma`}>
    {RABBITS.map(r => <Rabbit key={r.id} aria-hidden="true" fill={rabbits[r.id] ? r.color : "none"}
      className={`size-9 shrink-0 ${rabbits[r.id] ? "text-[#675343]" : "text-[#8c9588]"}`} />)}
  </span>;
}
