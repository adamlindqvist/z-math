import { CharacterPreview } from "./CharacterPreview";
import { useEffect, useState } from "react";
import { Gem, Play, ArrowLeft, Check } from "lucide-react";
import { gameStore, useGameState } from "../store/gameStore";
import { ITEMS } from "../items/definitions";
import { SHOP, SHOP_IDS } from "../items/shop";
import {
  Modal,
  CornerAction,
  cornerSecondary,
  primaryButton,
} from "./Dialogue";
import { ItemPicture } from "./Inventory";
export function ShopDialog() {
  const s = useGameState();
  const [greetingVisible, setGreetingVisible] = useState(false);
  useEffect(() => {
    setGreetingVisible(s.shopGreeting);
    if (!s.shopGreeting) return;
    const timer = window.setTimeout(() => setGreetingVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, [s.shopGreeting]);
  if (s.overlay === "castleDoor")
    return (
      <Modal
        label="Stängd dörr"
        action={
          <CornerAction onActivate={() => gameStore.close()}>
            <Play />
            Spela vidare
          </CornerAction>
        }
      >
        <h2>{s.castleMessage}</h2>
      </Modal>
    );
  if (s.overlay !== "shop")
    return s.location?.castle === "shop" && greetingVisible && !s.overlay ? (
      <div
        role="status"
        className="pointer-events-none absolute top-28 left-1/2 z-7 w-max max-w-[85%] -translate-x-1/2 rounded-3xl border-4 border-white bg-cream px-5 py-3 text-center text-xl font-bold shadow-lg"
      >
        Bosse: Hallå där, äventyrare!
      </div>
    ) : null;
  const id = s.shopSelection;
  const owned = id ? s.items.includes(id) : false;
  const equipped = id ? s.equipment[ITEMS[id].equipSlot] === id : false;
  const previewEquipment = id
    ? { ...s.equipment, [ITEMS[id].equipSlot]: id }
    : s.equipment;
  const wear = () => {
    if (id) {
      gameStore.equipItem(id, ITEMS[id].equipSlot);
    }
  };
  return (
    <Modal
      label="Bosses butik"
      sidecar={
        <CharacterPreview
          equipment={previewEquipment}
          trying={id && !equipped ? ITEMS[id].name : undefined}
        />
      }
      className="max-w-[760px]!"
      actionRows={s.shopPurchased ? 2 : 1}
      action={
        s.shopPurchased ? (
          <>
            {equipped ? (
              <CornerAction onActivate={() => gameStore.close()}>
                <Play />
                Spela vidare
              </CornerAction>
            ) : (
              <CornerAction onActivate={wear}>
                <Check />
                Ta på
              </CornerAction>
            )}
            <CornerAction
              className={cornerSecondary}
              onActivate={() => gameStore.selectShopItem(null)}
            >
              Fortsätt handla
            </CornerAction>
          </>
        ) : (
          <CornerAction onActivate={() => gameStore.close()}>
            <Play />
            Spela vidare
          </CornerAction>
        )
      }
    >
      <h2>
        {s.shopPurchased && id ? `Du köpte ${ITEMS[id].name}!` : "Bosses butik"}
      </h2>
      <p className="flex items-center justify-center gap-2 font-bold">
        <Gem aria-hidden="true" /> {s.rupees} rupees
      </p>
      {id ? (
        <>
          <ItemPicture id={id} />
          {!s.shopPurchased && (
            <h3 className="my-3 text-2xl font-black">{ITEMS[id].name}</h3>
          )}
          {equipped && (
            <p className="my-3 flex items-center justify-center gap-2 font-bold text-forest">
              <Check />
              På
            </p>
          )}
          <p>
            {s.shopPurchased
              ? "Den passar dig perfekt!"
              : ITEMS[id].description}
          </p>
          {!s.shopPurchased && (
            <div className="grid gap-4">
              <p className="text-xl font-bold">Pris: {SHOP[id]} rupees</p>
              {owned ? (
                <>
                  <p>Den där har du ju redan!</p>
                  {!equipped && (
                    <button className={primaryButton} onClick={wear}>
                      Ta på
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    className={`${primaryButton} disabled:opacity-60`}
                    disabled={s.rupees < SHOP[id]}
                    onClick={() => gameStore.buyItem(id)}
                  >
                    {s.rupees < SHOP[id]
                      ? `Du behöver ${SHOP[id] - s.rupees} rupees till`
                      : "Köp"}
                  </button>
                </>
              )}
              <button
                className={`${primaryButton} bg-[#e4eddd]! text-ink!`}
                onClick={() => gameStore.selectShopItem(null)}
              >
                <ArrowLeft />
                {equipped ? "Fortsätt handla" : "Alla varor"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="my-4 grid grid-cols-2 gap-4">
          {SHOP_IDS.map((item) => (
            <button
              key={item}
              className="flex min-h-44 cursor-pointer touch-manipulation flex-col items-center gap-2 rounded-3xl border-2 border-[#d7dfcd] bg-white/70 p-4 text-xl font-bold focus-visible:outline-4 focus-visible:outline-teal"
              onClick={() => gameStore.selectShopItem(item)}
            >
              <ItemPicture id={item} />
              <span>{ITEMS[item].name}</span>
              <span className="flex items-center gap-2">
                {s.items.includes(item) ? (
                  <>
                    <Check />
                    Äger
                  </>
                ) : (
                  <>
                    {SHOP[item]}
                    <Gem />
                  </>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
