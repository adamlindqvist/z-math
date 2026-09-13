import { useEffect } from "react";
import {
  Bug,
  CheckCircle2,
  DoorOpen,
  Gift,
  Map,
  RotateCcw,
  ShieldCheck,
  Sun,
  Sunset,
  Moon,
  Sunrise,
  X,
} from "lucide-react";
import {
  DUNGEONS,
  resolveRoom,
  roomSolved,
} from "../game/dungeons/definitions";
import { gameStore, useGameState } from "../store/gameStore";
import { Modal } from "./Dialogue";

const actionClass =
  "flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-[#e4eddd] px-4 py-3 text-lg font-extrabold text-ink enabled:cursor-pointer enabled:active:translate-y-0.5 disabled:opacity-45 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-teal";

export default function DebugMenu() {
  const state = useGameState();
  const current = resolveRoom(state.location);

  useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if (event.code !== "F2" || event.repeat) return;
      event.preventDefault();
      if (gameStore.getState().overlay === "debug") gameStore.closeDebug();
      else gameStore.openDebug();
    };
    window.addEventListener("keydown", toggle);
    return () => window.removeEventListener("keydown", toggle);
  }, []);

  if (state.overlay !== "debug")
    return !state.overlay && !state.motion ? (
      <button
        className="absolute top-1/2 right-[max(0px,env(safe-area-inset-right))] z-8 flex min-h-12 min-w-12 -translate-y-1/2 touch-manipulation items-center justify-center rounded-l-2xl border-2 border-r-0 border-white bg-[#2d3748dd] p-3 text-white shadow-lg backdrop-blur-sm active:translate-y-[calc(-50%+2px)] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-sunshine"
        aria-label="Öppna debugmenyn"
        title="Debug (F2)"
        onClick={() => gameStore.openDebug()}
      >
        <Bug aria-hidden="true" />
        {state.debugActive && (
          <span
            className="absolute -top-1 -left-1 size-3 rounded-full bg-[#ffce58] ring-2 ring-[#2d3748]"
            aria-label="Testsession aktiv"
          />
        )}
      </button>
    ) : null;

  return (
    <Modal
      label="Debugmeny"
      className="max-w-[820px] text-left [&>h2]:text-left"
    >
      <button
        className="absolute top-3 right-3 grid size-14 touch-manipulation place-items-center rounded-2xl bg-[#dce5d5] focus-visible:outline-4 focus-visible:outline-teal"
        aria-label="Stäng debugmenyn"
        onClick={() => gameStore.closeDebug()}
      >
        <X aria-hidden="true" />
      </button>

      <div className="mb-5 flex items-center gap-3 px-14">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#2d3748] text-white">
          <Bug aria-hidden="true" />
        </span>
        <div>
          <h2 className="m-0 text-3xl">Debug</h2>
          <p className="m-0 text-base text-[#536d5e]">
            {state.debugActive
              ? "Tillfällig testsession – sparfilen är skyddad"
              : "Första ändringen startar en tillfällig testsession"}
          </p>
        </div>
      </div>

      <section className="mb-6">
        <h3 className="mb-2 flex items-center gap-2 text-xl font-black">
          <Map aria-hidden="true" /> Hoppa till
        </h3>
        <div className="grid grid-cols-2 gap-2 max-[600px]:grid-cols-1">
          <button
            className={actionClass}
            aria-current={state.location === null ? "location" : undefined}
            onClick={() => gameStore.debugTravelTo(null)}
          >
            <DoorOpen aria-hidden="true" /> Gläntan
          </button>
          <button
            className={actionClass}
            aria-current={state.location?.world === "volcano" ? "location" : undefined}
            onClick={() => gameStore.debugTravelTo({ world: "volcano" })}
          >
            <DoorOpen aria-hidden="true" /> Vulkanvärlden
          </button>
          <button className={actionClass} onClick={() => gameStore.debugTravelTo({ world: "volcano-interior" })}>
            <DoorOpen aria-hidden="true" /> Vulkanens inre
          </button>
          {(["hall", "shop", "throne"] as const).map((castle) => (
            <button
              key={castle}
              className={actionClass}
              onClick={() => gameStore.debugTravelTo({ castle })}
            >
              {castle === "hall" ? "Entréhall" : castle === "throne" ? "Kungasalen" : "Bosses butik"}
            </button>
          ))}
          {(["water", "desert"] as const).map(world => <button key={world} className={actionClass} onClick={() => gameStore.debugTravelTo({ world })} aria-current={state.location?.world === world ? "location" : undefined}><DoorOpen aria-hidden="true" />{world === "water" ? "Vattenvärlden" : "Ökenvärlden"}</button>)}
          {DUNGEONS.flatMap((dungeon) =>
            dungeon.rooms.map((room) => {
              const selected =
                state.location?.dungeon === dungeon.id &&
                state.location.room === room.id;
              return (
                <button
                  key={`${dungeon.id}:${room.id}`}
                  className={`${actionClass} ${selected ? "ring-4 ring-teal" : ""}`}
                  aria-current={selected ? "location" : undefined}
                  onClick={() =>
                    gameStore.debugTravelTo({
                      dungeon: dungeon.id,
                      room: room.id,
                    })
                  }
                >
                  {dungeon.name} · {room.name}
                </button>
              );
            }),
          )}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-xl font-black">Tid i gläntan</h3>
        <p className="mb-3 text-base text-[#536d5e]">
          {state.location ? "Gå till gläntan för att byta tid." : "Välj tid. Dygnet fortsätter när du stänger menyn."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["day", "Dag", Sun], ["dusk", "Skymning", Sunset],
            ["night", "Natt", Moon], ["dawn", "Gryning", Sunrise],
          ] as const).map(([period, label, Icon]) => (
            <button key={period} className={actionClass} disabled={!!state.location}
              onClick={() => gameStore.debugSetDayPeriod(period)}>
              <Icon aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-xl font-black">Testverktyg</h3>
        <div className="grid grid-cols-2 gap-2 max-[600px]:grid-cols-1">
          <button
            className={actionClass}
            disabled={
              !current ||
              roomSolved(current.room, state.dungeons[current.dungeon.id])
            }
            onClick={() => gameStore.debugCompleteCurrentRoom()}
          >
            <CheckCircle2 aria-hidden="true" /> Klara aktuellt rum
          </button>
          <button
            className={actionClass}
            onClick={() => gameStore.debugOpenShop()}
          >
            Prova butiksköp (100 test-rupees)
          </button>
          <button
            className={actionClass}
            onClick={() => gameStore.debugGrantAllItems()}
          >
            <Gift aria-hidden="true" /> Ge alla föremål
          </button>
          <button
            className={actionClass}
            disabled={state.bridgeUnlocked}
            onClick={() => gameStore.debugUnlockBridge()}
          >
            <ShieldCheck aria-hidden="true" /> Lås upp bron
          </button>
          <button
            className={`${actionClass} ${state.debugNoclip ? "bg-[#b8e2cf] ring-4 ring-teal" : ""}`}
            aria-pressed={state.debugNoclip}
            onClick={() => gameStore.debugSetNoclip(!state.debugNoclip)}
          >
            Noclip: {state.debugNoclip ? "På" : "Av"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 border-t-2 border-[#d8dfcf] pt-5 max-[600px]:grid-cols-1">
        <button className={actionClass} onClick={() => gameStore.debugReset()}>
          <RotateCcw aria-hidden="true" /> Börja temporärt om
        </button>
        <button
          className={`${actionClass} bg-[#2d3748]`}
          disabled={!state.debugActive}
          onClick={() => gameStore.debugEndSession()}
        >
          Avsluta testsession
        </button>
      </section>
    </Modal>
  );
}
