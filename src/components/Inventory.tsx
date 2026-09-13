import { CharacterPreview } from "./CharacterPreview";
import {
  Gem,
  Flame,
  Feather,
  Backpack,
  Check,
  Package,
  Shield,
  Shirt,
  Sword,
  X,
  Play,
} from "lucide-react";
import { ITEMS, type ItemDefinition, type ItemId } from "../items/definitions";
import { gameStore, useGameState } from "../store/gameStore";
import { CornerAction, Modal, cornerSecondary } from "./Dialogue";

export function ItemPicture({ id }: { id: ItemId }) {
  const icons = {
    hat: Feather,
    shirt: Shirt,
    sword: Sword,
    shield: Shield,
    package: Package,
  };
  const Icon = icons[ITEMS[id].icon];
  if (id === "sun-hat") return <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden="true"><ellipse cx="40" cy="53" rx="35" ry="12" fill="#e9c67c"/><path d="M19 49L23 22Q40 13 57 22L61 49Z" fill="#e9c67c" stroke="#af793f" strokeWidth="3"/><path d="M21 41Q40 48 59 41" fill="none" stroke="#399dab" strokeWidth="8"/></svg>;
  if (id === "water-shield") return <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden="true"><circle cx="40" cy="40" r="31" fill="#258fae" stroke="#b4e9e3" strokeWidth="5"/><path d="M18 32Q26 22 34 32T50 32T66 32M18 48Q26 38 34 48T50 48T66 48" fill="none" stroke="#e4fff2" strokeWidth="4"/></svg>;
  if (id === "lava_hat") return (
    <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden="true">
      <path d="M35 26L41 9L46 27Z" fill="#ffc266" />
      <path d="M14 56Q13 21 40 21Q67 21 66 56Z" fill="#3a3038" />
      <path d="M40 22L35 34L45 43L42 56M35 34L23 37L19 52M45 43L57 44L61 54" fill="none" stroke="#ffad44" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="29" cy="27" r="2.4" fill="#ff8b33" />
      <circle cx="53" cy="33" r="2.2" fill="#ff8b33" />
      <path d="M7 54H73L71 68H9Z" fill="#3a3038" />
      <path d="M11 62H69V65H11Z" fill="#ff8b33" />
      <path d="M15 57H26V64H15ZM33 56H40V64H33ZM47 57H58V64H47Z" fill="#ffc266" />
    </svg>
  );
  if (id === "stone_armor") return (
    <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden="true" strokeLinejoin="round">
      <path d="M19 24L30 20L35 32L29 45L15 43L9 32Z" fill="#5f6270" stroke="#434552" strokeWidth="3" />
      <path d="M61 24L50 20L45 32L51 45L65 43L71 32Z" fill="#5f6270" stroke="#434552" strokeWidth="3" />
      <path d="M28 22L40 17L53 23L58 40L54 53L57 68L40 72L23 68L26 53L22 40Z" fill="#777783" stroke="#434552" strokeWidth="3" />
      <path d="M40 17L37 37L48 46L54 53M37 37L25 43L26 53M48 46L45 61L40 72" fill="none" stroke="#434552" strokeWidth="2.5" />
    </svg>
  );
  if (id === "green-clothes" || id === "blue-tunic")
    return (
      <svg
        viewBox="0 0 80 80"
        className="mx-auto size-16"
        aria-hidden="true"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M27 16L18 21L8 36L18 43L23 36L20 68H60L57 36L62 43L72 36L62 21L53 16L47 21H33Z"
          fill={id === "blue-tunic" ? "#487344" : "#36964a"}
          stroke="#225f38"
          strokeWidth="3"
        />
        <path
          d="M18 22L8 36L18 43L25 32L24 20ZM62 22L72 36L62 43L55 32L56 20Z"
          fill="#fff1d4"
          stroke="#d7b98c"
          strokeWidth="3"
        />
        <path
          d="M27 16L33 21L40 31L47 21L53 16L48 13L40 18L32 13Z"
          fill="#fff1d4"
          stroke="#225f38"
          strokeWidth="2.5"
        />
        <path
          d="M22 50H58L59 59H21Z"
          fill="#805033"
          stroke="#5d3826"
          strokeWidth="2.5"
        />
        <path
          d="M35 49H45V60H35Z"
          fill="#efbd45"
          stroke="#8a6224"
          strokeWidth="2.5"
        />
        <path d="M38 52H42V57H38Z" fill="#805033" />
        <path
          d="M29 27V46M51 27V46"
          fill="none"
          stroke="#54ae63"
          strokeWidth="2"
        />
        <path
          d="M25 64H55"
          fill="none"
          stroke="#267347"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        {id === "blue-tunic" && (
          <>
            <path d="M30 13Q40 19 50 13Q65 17 73 32L63 40L55 35L47 41L40 28L33 41L25 35L17 40L7 32Q15 17 30 13Z" fill="#244d35" stroke="#183d2b" strokeWidth="2.5" />
            <path d="M40 20Q28 28 40 35Q51 25 40 20Z" fill="#efbd45" stroke="#8a6224" strokeWidth="1.5" />
            <path d="M39 31L41 24" stroke="#8a6224" strokeWidth="1.5" />
            <rect x="48" y="51" width="17" height="20" rx="5" fill="#71452c" stroke="#513321" strokeWidth="2" />
            <path d="M48 52H65V57Q57 64 48 57Z" fill="#97623d" stroke="#513321" strokeWidth="2" />
            <circle cx="56.5" cy="59" r="2" fill="#efbd45" />
          </>
        )}
      </svg>
    );
  if (id === "royal-crown")
    return (
      <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden="true">
        <path
          d="M12 60L7 22L26 36L40 12L54 36L73 22L68 60Z"
          fill="#dca72e"
          stroke="#71323c"
          strokeWidth="3"
        />
        <path
          d="M12 55H68V67H12Z"
          fill="#71323c"
          stroke="#71323c"
          strokeWidth="2"
        />
        <circle cx="40" cy="49" r="8" fill="#b53951" />
        <circle cx="21" cy="51" r="4" fill="#c32040" />
        <circle cx="59" cy="51" r="4" fill="#c32040" />
      </svg>
    );
  if (id === "base-hat")
    return (
      <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden="true">
        <path
          d="M12 56 Q10 29 35 25 L68 12 L59 40 Q70 47 68 56Z"
          fill="#36964a"
        />
        <path d="M9 55 Q40 47 71 55 L68 64 H12Z" fill="#267347" />
      </svg>
    );
  if (id === "green-hat")
    return (
      <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden="true">
        <path d="M12 55 Q14 22 43 23 Q65 26 67 55Z" fill="#267347" />
        <path d="M7 56 Q38 46 73 56 L68 65 H13Z" fill="#348353" />
        <path
          d="M50 42 Q46 9 69 5 Q76 30 50 42Z"
          fill="#f3cc60"
          stroke="#805d36"
          strokeWidth="2"
        />
        <path d="M48 48L66 12" stroke="#805d36" strokeWidth="2" />
      </svg>
    );
  const fire = id === "fire-sword" || id === "fire-shield";
  return (
    <span className="relative mx-auto block size-16" aria-hidden="true">
      <Icon
        className={`size-16 ${fire ? "text-[#b64925]" : id.startsWith("wooden-") ? "text-[#a36c38]" : "text-forest"}`}
      />
      {fire && (
        <Flame className="absolute -right-2 -bottom-1 size-8 rounded-full bg-[#fff0b8] text-[#da5d1f]" />
      )}
    </span>
  );
}
const slotButton =
  "min-h-16 w-full cursor-pointer touch-manipulation rounded-2xl bg-[#e4eddd] p-3 text-xl font-extrabold focus-visible:outline-4 focus-visible:outline-teal";
export function InventoryDialog() {
  const state = useGameState();
  if (state.overlay === "itemReward")
    return (
      <Modal
        label="Din belöning"
        className="pt-20!"
        actionRows={2}
        action={
          <>
            <CornerAction onActivate={() => gameStore.openInventory()}>
              <Backpack />
              Visa väskan
            </CornerAction>
            <CornerAction
              className={cornerSecondary}
              onActivate={() => gameStore.close()}
            >
              <Play />
              Spela vidare
            </CornerAction>
          </>
        }
      >
        <h2>
          {state.rewardItems.length === 1
            ? `Du fick ${ITEMS[state.rewardItems[0]].name.toLocaleLowerCase("sv")}!`
            : "Du fick ny utrustning!"}
        </h2>
        <div className="my-6 flex flex-wrap justify-center gap-8">
          {state.rewardItems.map((id) => (
            <div key={id}>
              <ItemPicture id={id} />
              <p className="mt-2 text-xl font-bold">{ITEMS[id].name}</p>
            </div>
          ))}
        </div>
        <p className="flex items-center justify-center gap-2">
          <Gem aria-hidden="true" /> +{state.reward} rupees
        </p>
        <p>
          {state.rewardItems.includes("royal-crown")
            ? "Kronan är på!"
            : "Utrustningen är på."}
        </p>
      </Modal>
    );
  if (state.overlay !== "inventory") return null;
  return (
    <Modal
      label="Väska"
      sidecar={<CharacterPreview equipment={state.equipment} />}
      action={
        <CornerAction onActivate={() => gameStore.close()}>
          <Play />
          Spela vidare
        </CornerAction>
      }
    >
      <button
        className="absolute top-3 right-3 grid size-16 cursor-pointer touch-manipulation place-items-center rounded-2xl bg-[#e4eddd] focus-visible:outline-4 focus-visible:outline-teal"
        aria-label="Stäng väskan"
        onClick={() => gameStore.close()}
      >
        <X size={32} />
      </button>
      <Backpack className="mx-auto size-12 text-forest" aria-hidden="true" />
      <h2>Min väska</h2>
      <div className="my-5 grid grid-cols-2 gap-4 min-[700px]:grid-cols-3">
        {state.items.map((id) => {
          const item: ItemDefinition = ITEMS[id];
          const slot = item.equipSlot;
          const equipped = slot !== undefined && state.equipment[slot] === id;
          return (
            <section
              key={id}
              aria-label={item.name}
              className="flex flex-col gap-3 rounded-3xl border-2 border-[#d7dfcd] bg-white/60 p-3"
            >
              <ItemPicture id={id} />
              <h3 className="text-xl font-extrabold wrap-break-word">{item.name}</h3>
              <span className="flex min-h-7 items-center justify-center gap-1 font-bold text-forest">
                {equipped && (
                  <>
                    <Check size={22} />
                    På
                  </>
                )}
              </span>
              {slot !== undefined && !(id === "green-clothes" && equipped) && (
                <button
                  className={`${slotButton} mt-auto`}
                  aria-label={`${equipped ? "Ta av" : "Ta på"} ${item.name.toLowerCase()}`}
                  onClick={() =>
                    equipped
                      ? gameStore.unequipItem(slot)
                      : gameStore.equipItem(id, slot)
                  }
                >
                  {equipped ? "Ta av" : "Ta på"}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
