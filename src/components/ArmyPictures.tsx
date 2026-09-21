import { Check } from "lucide-react";
import { ARMY, type ArmyId } from "../game/underworld/army";

export function ArmyPictures({ defeated }: { defeated: ArmyId[] }) {
  return <div className="mt-2 flex gap-2" role="img" aria-label={`${defeated.length} av 3 Bokobliner besegrade`}>
    {ARMY.map(b => <span key={b.id} aria-hidden="true" className={`relative grid size-9 shrink-0 place-items-center rounded-xl ${defeated.includes(b.id) ? "bg-[#dcebcf]" : "bg-[#fbe0da]"}`}>
      <svg viewBox="0 0 40 40" className={`size-8 ${defeated.includes(b.id) ? "opacity-30" : ""}`}>
        <path d="M12 13 2 7 6 21 12 24M28 13 38 7 34 21 28 24" fill="#a92335" />
        <ellipse cx="20" cy="21" rx="12" ry="13" fill="#bf3040" />
        <path d="m17 10 3-8 3 8" fill="#ead9ad" />
        <circle cx="15" cy="19" r="2.2" fill="#ffe3a7" />
        <circle cx="25" cy="19" r="2.2" fill="#ffe3a7" />
        <ellipse cx="20" cy="26" rx="7" ry="5" fill="#f0756c" />
        <circle cx="17" cy="26" r="1.3" fill="#632330" />
        <circle cx="23" cy="26" r="1.3" fill="#632330" />
      </svg>
      {defeated.includes(b.id) && <Check className="absolute size-7 text-[#286b3d]" strokeWidth={4} />}
    </span>)}
  </div>;
}
