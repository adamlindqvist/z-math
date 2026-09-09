import {
  Flame,
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

function ItemPicture({ id }: { id: ItemId }) {
  const icons = {
    shirt: Shirt,
    sword: Sword,
    shield: Shield,
    package: Package,
  };
  const Icon = icons[ITEMS[id].icon];
  const fire = id === "fire-sword" || id === "fire-shield";
  return (
    <span className="relative mx-auto block size-16" aria-hidden="true">
      <Icon className={`size-16 ${fire ? "text-[#b64925]" : "text-forest"}`} />
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
          {state.rewardItems.includes("fire-sword")
            ? "Du fick eldsvärd och eldsköld!"
            : "Du fick svärd och sköld!"}
        </h2>
        <div className="my-6 flex flex-wrap justify-center gap-8">
          {state.rewardItems.map((id) => (
            <div key={id}>
              <ItemPicture id={id} />
              <p className="mt-2 text-xl font-bold">{ITEMS[id].name}</p>
            </div>
          ))}
        </div>
        <p>Och {state.reward} rupees! Utrustningen är på.</p>
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
          const slot = item.category;
          const equipped = slot !== "other" && state.equipment[slot] === id;
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
              {slot !== "other" && !(slot === "clothes" && equipped) && (
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
