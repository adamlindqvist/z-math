import {
  resolveRoom,
  roomSolved,
  DUNGEONS,
} from "../game/dungeons/definitions";
import { RotateCcw, Sun, Leaf, Moon, Check as SolvedIcon } from "lucide-react";
import { Gem, Pause, Check, Compass } from "lucide-react";
import { gameStore, useGameState } from "../store/gameStore";
import { eyebrow } from "./Dialogue";
export function HUD() {
  const state = useGameState();
  const current = resolveRoom(state.location);
  const solved = current
    ? roomSolved(current.room, state.dungeons[current.dungeon.id])
    : false;
  const templeDone = DUNGEONS.every((d) =>
    d.rooms.every((r) => roomSolved(r, state.dungeons[d.id])),
  );
  return (
    <>
      <div className="pointer-events-none absolute inset-x-[35px] top-[max(24px,env(safe-area-inset-top))] z-4 flex items-start justify-between max-[850px]:inset-x-[22px] max-[540px]:inset-x-3.5 max-[540px]:gap-[9px]">
        <section className="flex max-w-[345px] items-center gap-[13px] rounded-[18px] border border-[#fffefa] bg-[#fffcf2ef] px-[19px] py-[18px] shadow-[0_5px_20px_#3f593510] max-[850px]:max-w-[300px] max-[850px]:gap-2.5 max-[850px]:p-[13px] max-[540px]:max-w-[230px] max-[540px]:gap-0 max-[540px]:rounded-[14px] max-[540px]:p-3 [@media(max-height:620px)_and_(min-width:541px)]:px-3 [@media(max-height:620px)_and_(min-width:541px)]:py-[9px]">
          <div className="grid h-[45px] min-w-[45px] place-items-center rounded-[13px] bg-[#edf0dc] text-[#77915b] max-[850px]:hidden">
            {state.chestOpened ? <Check size={22} /> : <Compass size={24} />}
          </div>
          <div>
            <p className={eyebrow}>
              {current
                ? current.dungeon.name
                : state.chestOpened
                  ? "FINT JOBBAT, ÄVENTYRARE"
                  : "DITT FÖRSTA ÄVENTYR"}
            </p>
            <h2 className="text-base leading-[1.3] font-extrabold tracking-[-0.4px] max-[850px]:text-sm">
              {current
                ? current.room.name
                : state.chestOpened
                  ? "Skatten är din!"
                  : "En skatt i gläntan"}
            </h2>
            <p className="mt-1.5 text-[11px] text-[#89917c] max-[850px]:text-[10px] max-[540px]:text-[9px] [@media(max-height:620px)_and_(min-width:541px)]:hidden">
              {current
                ? solved
                  ? "Fint! Gå genom den öppna porten ↑"
                  : current.room.hint
                : state.chestOpened
                  ? templeDone
                    ? "Du hittade templets skatt!"
                    : "Hitta stenporten till Mosstemplet. ☀"
                  : state.talkedToNpc
                    ? "Följ stigen till skattkistan."
                    : "Prata med Zelda vid huset."}
            </p>
          </div>
          <span className="ml-[7px] self-start rounded-md bg-[#edf0e1] px-[7px] py-1 text-[10px] text-[#94a080] max-[850px]:ml-0 max-[540px]:hidden">
            {current
              ? `${current.dungeon.rooms.indexOf(current.room) + 1}/${current.dungeon.rooms.length}`
              : `${state.chestOpened ? 2 : state.talkedToNpc ? 1 : 0}/2`}
          </span>
        </section>
        <div className="pointer-events-auto flex gap-2.5 max-[540px]:gap-1.5">
          <div
            className="flex h-[57px] items-center gap-[11px] rounded-[17px] border border-[#fffef9] bg-[#fffbef] py-2 pr-[19px] pl-[9px] shadow-[0_4px_15px_#4b623212] max-[540px]:h-[49px] max-[540px]:gap-1.5 max-[540px]:rounded-[14px] max-[540px]:py-[7px] max-[540px]:pr-2.5 max-[540px]:pl-[7px] [@media(max-height:620px)_and_(min-width:541px)]:h-12"
            aria-label={`${state.rupees} Rupees`}
          >
            <span className="grid h-[39px] w-[39px] place-items-center rounded-xl bg-[#d9ebed] text-[#338e93] max-[540px]:h-[34px] max-[540px]:w-[31px] max-[540px]:rounded-[10px] max-[540px]:[&_svg]:w-5">
              <Gem size={24} />
            </span>
            <strong
              className="text-2xl text-[#55533a] max-[540px]:text-[21px]"
              aria-live="polite"
            >
              {state.rupees}
            </strong>
            <span className="-ml-[5px] text-xs text-[#969079] max-[540px]:hidden">
              Rupees
            </span>
          </div>
          <button
            className="grid h-[57px] min-h-14 w-[57px] min-w-14 cursor-pointer place-items-center rounded-[17px] border border-[#fffefa] bg-[#fffcf0] text-[#758364] shadow-[0_4px_15px_#4b623212] transition hover:brightness-[1.03] active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#d89743] disabled:cursor-default disabled:opacity-55 max-[540px]:h-[49px] max-[540px]:w-[49px] max-[540px]:rounded-[14px] [@media(max-height:620px)_and_(min-width:541px)]:h-12"
            aria-label="Pausa spelet"
            disabled={!!state.overlay}
            onClick={() => gameStore.pause()}
          >
            <Pause size={23} />
          </button>
        </div>
      </div>
      {current?.room.stones && !state.overlay && (
        <div className="pointer-events-auto absolute left-[max(22px,env(safe-area-inset-left))] top-32 z-5 flex items-center gap-3 rounded-2xl bg-[#fffbefee] p-2 shadow-sm">
          <span
            className="flex gap-2 px-2 text-[#66814d]"
            aria-label={
              solved ? "Alla stenar på plats" : "Matcha sol, löv och måne"
            }
          >
            {solved && <SolvedIcon size={22} />}
            <Sun size={22} />
            <Leaf size={22} />
            <Moon size={22} />
          </span>
          {!solved && (
            <button
              className="flex min-h-14 items-center gap-2 rounded-xl bg-[#e5ebd5] px-3 text-sm font-bold disabled:opacity-50"
              disabled={!!state.motion}
              onClick={() => gameStore.resetPuzzle()}
              aria-label="Börja om med stenarna"
            >
              <RotateCcw size={24} />
              Stenarna
            </button>
          )}
        </div>
      )}
    </>
  );
}
