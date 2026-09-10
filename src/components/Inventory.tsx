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
  if (id === "royal-crown") return <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden="true">
    <path d="M12 60L7 22L26 36L40 12L54 36L73 22L68 60Z" fill="#dca72e" stroke="#71323c" strokeWidth="3" />
    <path d="M12 55H68V67H12Z" fill="#71323c" stroke="#71323c" strokeWidth="2" />
    <circle cx="40" cy="49" r="8" fill="#b53951" />
    <circle cx="21" cy="51" r="4" fill="#c32040" /><circle cx="59" cy="51" r="4" fill="#c32040" />
  </svg>;
  if (id === "base-hat")
    return (
      <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden="true">
        <path d="M12 56 Q10 29 35 25 L68 12 L59 40 Q70 47 68 56Z" fill="#36964a" />
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
        className={`size-16 ${fire ? "text-[#b64925]" : id === "blue-tunic" ? "text-[#3489cb]" : id.startsWith("wooden-") ? "text-[#a36c38]" : "text-forest"}`}
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
          {state.rewardItems.length === 1 ? `Du fick ${ITEMS[state.rewardItems[0]].name.toLocaleLowerCase("sv")}!` : "Du fick ny utrustning!"}
        </h2>
        <div className="my-6 flex flex-wrap justify-center gap-8">
          {state.rewardItems.map((id) => (
            <div key={id}>
              <ItemPicture id={id} />
              <p className="mt-2 text-xl font-bold">{ITEMS[id].name}</p>
            </div>
          ))}
        </div>
        <p className="flex items-center justify-center gap-2"><Gem aria-hidden="true" /> +{state.reward} rupees</p>
        <p>{state.rewardItems.includes("royal-crown") ? "Kronan är på!" : "Utrustningen är på."}</p>
      </Modal>
    );
  if (state.overlay !== "inventory") return null;
  return (
    <Modal
      label="Väska"
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
              <h3 className="text-xl font-extrabold">{item.name}</h3>
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
