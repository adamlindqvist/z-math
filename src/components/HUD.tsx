import { RabbitPictures } from "./RabbitPictures";
import { rabbitsHome } from "../game/rabbits/definitions";
import { Rabbit } from "lucide-react";
import { MinibossHUD } from "./MinibossHUD";
import { resolveRoom, roomSolved, volcanoGateOpen } from "../game/dungeons/definitions";
import {
  Crown,
  Backpack,
  RotateCcw,
  Sun,
  Leaf,
  Moon,
  Check,
  Gem,
  Pause,
  MessageCircle,
  DoorOpen,
  Sword,
} from "lucide-react";
import {
  gameStore,
  useGameState,
  hasBridgeEquipment,
} from "../store/gameStore";
import { StoryPicture } from "./StoryPicture";
export function HUD() {
  const state = useGameState();
  const current = resolveRoom(state.location);
  const solved = current
    ? roomSolved(current.room, state.dungeons[current.dungeon.id])
    : false;
  const hint =
    state.location?.world === "volcano-interior" ? (volcanoGateOpen(state.dungeons) ? "Den stora porten är öppen!" : "Eldtemplet ligger till höger!") :
    state.location?.world === "volcano" ? (state.minibosses.stone_giant === 3 ? "Vulkanens ingång är öppen!" : "Besegra Stenjätten. Öppna vulkanen!") :
    state.location === null && state.bridgeUnlocked ? (rabbitsHome(state.rabbits) ? "Gå till den lysande portalen!" : state.followingRabbits.length ? "Gå till kaninhagen!" : "Hitta kaninerna!") :
    state.location?.castle === "throne"
      ? "Vad finns här?"
      : state.location?.castle === "hall"
      ? "Butiken ligger till höger!"
      : state.location?.castle === "shop"
        ? "Gå fram till Bosse eller en vara!"
        : current
          ? solved
            ? "Gå genom den öppna porten!"
            : current.room.hint
          : state.bridgeUnlocked
            ? state.chests.south
              ? state.dungeons.fire.rewards.includes("fire-treasure-lock")
                ? "Du hittade Eldtemplets skatt!"
                : "Gå in i Eldtemplet!"
              : "Gå över bron till kistan!"
            : hasBridgeEquipment(state)
              ? "Gå till bron. Skräm iväg Bokoblin!"
              : state.chests.glade
                ? "Hitta svärd och sköld i Gläntans tempel!"
                : state.talkedToNpc
                  ? "Leta efter kistan!"
                  : "Prata med Zelda!";
  return (
    <div className="pointer-events-none absolute top-[max(20px,env(safe-area-inset-top))] right-[max(20px,env(safe-area-inset-right))] left-[max(20px,env(safe-area-inset-left))] z-4 flex items-start justify-between gap-4 max-[600px]:right-3 max-[600px]:left-3 max-[600px]:gap-2">
      <div className="min-w-0 max-w-[430px] [@media(max-height:850px)]:max-w-[320px]">
        {state.encounter && !state.overlay ? <MinibossHUD encounter={state.encounter} /> : <section className="flex items-center gap-3.5 rounded-[26px] border-[3px] border-white bg-cream p-4 text-ink shadow-[0_5px_0_#344e3020] [&_h2]:text-[23px] [&_h2]:leading-tight [&_h2]:font-black max-[600px]:gap-2 max-[600px]:p-2.5 max-[600px]:[&_h2]:text-lg">
          <div
            className="grid size-16 shrink-0 place-items-center rounded-[20px] bg-[#ffedab] text-forest [&_svg]:size-11! max-[600px]:hidden"
            aria-hidden="true"
          >
            {state.location === null && state.bridgeUnlocked && !rabbitsHome(state.rabbits) ? <Rabbit /> : state.location?.world === "volcano" || (state.location === null && state.bridgeUnlocked) ? <DoorOpen /> : state.location?.castle === "throne" ? <Crown /> : current ? (
              solved ? (
                <DoorOpen />
              ) : (
                <Sun />
              )
            ) : state.bridgeUnlocked ? (
              state.chests.south ? (
                <Check />
              ) : (
                <StoryPicture kind="chest" />
              )
            ) : hasBridgeEquipment(state) ? (
              <DoorOpen />
            ) : state.chests.glade ? (
              <Sword />
            ) : state.talkedToNpc ? (
              <StoryPicture kind="chest" />
            ) : (
              <MessageCircle />
            )}
          </div>
          <div>
            <p className="text-base font-bold text-[#536d5e] max-[600px]:text-sm">
              {state.location?.world === "volcano-interior" ? "Vulkanens inre" : state.location?.world === "volcano" ? "Vulkanvärlden" : state.location?.castle
                ? state.location.castle === "hall"
                  ? "Slottets entréhall"
                  : state.location.castle === "throne" ? "Kungasalen" : "Bosses butik"
                : current
                  ? `${current.dungeon.name} · ${current.room.name}`
                  : "Matteäventyret"}
            </p>
            <h2>{hint}</h2>
            {state.location === null && state.bridgeUnlocked && !rabbitsHome(state.rabbits) && <div className="mt-2"><RabbitPictures rabbits={state.rabbits} /></div>}
          </div>
        </section>}
        {current?.room.stones && !state.overlay && (
          <div className="pointer-events-auto mt-3 flex flex-wrap items-center gap-3 rounded-3xl bg-cream p-2.5">
            <span
              className="flex gap-3 p-2 text-teal [&_svg]:size-8"
              aria-label={
                solved ? "Alla stenar på plats" : "Matcha sol, löv och måne"
              }
            >
              {solved && <Check />}
              <Sun />
              <Leaf />
              <Moon />
            </span>
            {!solved && (
              <button
                className="cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none flex min-h-16 items-center justify-center gap-2.5 rounded-[18px] bg-[#e4eddd] p-3 text-xl"
                disabled={!!state.motion}
                onClick={() => gameStore.resetPuzzle()}
                aria-label="Börja om med stenarna"
              >
                <RotateCcw />
                Börja om
              </button>
            )}
          </div>
        )}
      </div>
      <div className="pointer-events-auto flex shrink-0 gap-3 max-[600px]:gap-1.5">
        <button
          className="flex min-h-[72px] min-w-18 cursor-pointer touch-manipulation flex-col items-center justify-center rounded-3xl border-[3px] border-white bg-cream px-3 text-ink font-extrabold disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-teal max-[600px]:min-h-16"
          disabled={!!state.overlay || !!state.motion}
          onClick={() => gameStore.openInventory()}
        >
          <Backpack size={30} aria-hidden="true" />
          <span>Väska</span>
        </button>
        <div
          className="flex min-h-[72px] items-center justify-center gap-2.5 rounded-3xl border-[3px] border-white bg-cream p-3 text-[32px] text-ink [&_svg]:size-9 [&_svg]:fill-[#c4eee0] [&_svg]:text-teal max-[600px]:min-h-16 max-[600px]:p-2 max-[600px]:text-[26px] max-[600px]:[&_svg]:w-7"
          aria-label={`${state.rupees} Rupees`}
        >
          <Gem aria-hidden="true" />
          <strong aria-live="polite">{state.rupees}</strong>
        </div>
        <button
          className="cursor-pointer touch-manipulation font-extrabold transition duration-150 enabled:active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none flex min-h-[72px] w-[72px] items-center justify-center rounded-3xl border-[3px] border-white bg-cream p-3 text-ink disabled:opacity-50 [&_svg]:size-8 max-[600px]:min-h-16 max-[600px]:w-16"
          aria-label="Pausa spelet"
          disabled={!!state.overlay}
          onClick={() => gameStore.pause()}
        >
          <Pause />
        </button>
      </div>
    </div>
  );
}
