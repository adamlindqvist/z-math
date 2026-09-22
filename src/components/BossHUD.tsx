import { Heart, Footprints, Sword, Sparkles, Check, ChevronsRight } from "lucide-react";
import { useGameState } from "../store/gameStore";
import { bossHint, bossOpening, litCompanions, bossDefeated } from "../game/boss/state";
import { YunoboPicture } from "./YunoboPicture";
import { SidonPicture } from "./SidonPicture";
import { TulinPicture } from "./TulinPicture";
import { RijuPicture } from "./RijuPicture";
export function CompanionPortrait({ index }: { index: number }) {
  return index === 0 ? <YunoboPicture /> : index === 1 ? <SidonPicture small /> : index === 2 ? <TulinPicture small /> : <RijuPicture small />;
}
export function BossHUD() {
  const { boss: b, bossFeedback } = useGameState();
  const demon = b.teamHits === 4;
  const done = bossDefeated(b);
  return <section data-testid="boss-hud" className="max-w-[350px] rounded-3xl border-2 border-[#eacb89] bg-[#202637ed] p-3 text-white shadow-lg max-[600px]:max-w-[235px] max-[600px]:p-2">
    <p className="text-sm font-bold text-[#f4d79b]">{done ? "Äventyret är klart!" : demon ? "Demonkungen Ganondorf" : "Ganondorf"}</p>
    <div key={`${b.teamHits}-${b.demonHits}`} className={`my-2 flex gap-2 ${bossFeedback.startsWith("Träff") || bossFeedback.startsWith("Fullträff") ? "motion-safe:animate-bounce" : ""}`} aria-label={demon ? `${3 - b.demonHits} mörka hjärtan kvar` : `${b.teamHits} av 4 delar klara`}>
      {demon ? [0, 1, 2].map(i => <Heart key={i} className={`size-7 ${i < 3 - b.demonHits ? "fill-[#b786e9] text-[#e7caff]" : "text-[#667084]"}`} />) : [0, 1, 2, 3].map(i => <span key={i} className={`grid size-7 place-items-center rounded-full border-2 ${i < b.teamHits ? "border-[#adffe0] bg-[#38675b]" : "border-[#747d8e]"}`}>{i < b.teamHits && <Check className="size-5" />}</span>)}
    </div>
    <div className="flex gap-2" aria-label="Vännernas kraft">
      {["Yunobo", "Sidon", "Tulin", "Riju"].map((name, i) => {
        const lit = demon ? i < litCompanions(b) : i < b.teamHits || i === b.teamHits && b.stage === "companion_ready";
        return <div key={name} aria-label={`${name}${lit ? ", lyser" : ""}`} className={`grid size-12 place-items-center overflow-hidden rounded-2xl border-2 [&>svg]:max-h-11 [&>svg]:max-w-11 ${lit ? "border-[#ffe4a0] bg-[#6b6853]" : "border-[#636b7b] bg-[#343e50]"} ${demon && !lit ? "opacity-35" : ""}`}><CompanionPortrait index={i} /></div>;
      })}
    </div>
    {bossFeedback && <div role="status" aria-live="assertive" aria-label={bossFeedback} className={`mt-2 flex h-14 items-center justify-center gap-1 rounded-2xl border-4 ${bossFeedback.startsWith("För långt") ? "border-[#ffe08a] bg-[#814e24] text-[#fff2b8]" : "border-[#edffb5] bg-[#34764d] text-white motion-safe:animate-pulse"}`}>
      {bossFeedback.startsWith("För långt") ? <><Footprints className="size-8" /><ChevronsRight className="size-8" /><Sword className="size-9" /></> : <><Sword className="size-9" /><Check className="size-11 stroke-[4]" /></>}
      <span className="sr-only">{bossFeedback}</span>
    </div>}
    <p role="status" aria-live="polite" className="mt-2 flex items-center gap-2 text-lg font-extrabold leading-tight max-[600px]:text-base">
      {bossOpening(b.stage) || b.stage === "final_ready" ? <Sword className="size-6 shrink-0 text-[#ffe4a0]" /> : b.stage.endsWith("attacks") ? <Footprints className="size-6 shrink-0" /> : <Sparkles className="size-6 shrink-0 text-[#ffe4a0]" />}
      {bossHint(b)}
    </p>
  </section>;
}
