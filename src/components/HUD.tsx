import {
  Coins,
  Pause,
  MapPin,
  Check,
  Sprout,
  Compass,
  Leaf,
} from "lucide-react";
import { gameStore, useGameState } from "../store/gameStore";
export function HUD() {
  const state = useGameState();
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">
            <Sprout size={27} />
          </span>
          <div>
            <h1>
              Gläntans skatt<span className="brand-dot">.</span>
            </h1>
            <p>ETT LITET MATTEÄVENTYR</p>
          </div>
        </div>
        <div className="header-right">
          <span className="save-status">
            <span className="status-dot" />
            {state.savingAvailable
              ? "Äventyret sparas"
              : "Spelar utan sparning"}
          </span>
          <span className="chapter">KAPITEL 01</span>
        </div>
      </header>
      <div className="hud-top">
        <section className="quest-card">
          <div className="quest-icon">
            {state.chestOpened ? <Check size={22} /> : <Compass size={24} />}
          </div>
          <div>
            <p className="eyebrow">
              {state.chestOpened
                ? "FINT JOBBAT, ÄVENTYRARE"
                : "DITT FÖRSTA ÄVENTYR"}
            </p>
            <h2>
              {state.chestOpened ? "Skatten är din!" : "En skatt i gläntan"}
            </h2>
            <p className="quest-detail">
              {state.chestOpened
                ? "Utforska och hitta alla mynt."
                : state.talkedToNpc
                  ? "Följ stigen till skattkistan."
                  : "Prata med Maja vid huset."}
            </p>
          </div>
          <span className="quest-count">
            {state.chestOpened ? "2" : state.talkedToNpc ? "1" : "0"}/2
          </span>
        </section>
        <div className="hud-actions">
          <div className="coin-counter" aria-label={`${state.coins} mynt`}>
            <span className="coin-icon">
              <Coins size={24} />
            </span>
            <strong aria-live="polite">{state.coins}</strong>
            <span>mynt</span>
          </div>
          <button
            className="pause-button"
            aria-label="Pausa spelet"
            disabled={!!state.overlay}
            onClick={() => gameStore.pause()}
          >
            <Pause size={23} />
          </button>
        </div>
      </div>
      <div className="world-label">
        <MapPin size={15} />
        <span>Den lilla gläntan</span>
        <span className="label-dot">·</span>
        <span className="world-label-sub">Här börjar din resa</span>
      </div>
      <footer className="bottom-bar">
        <span className="area-caption">
          <Leaf size={16} /> Små steg. Stora upptäckter.
        </span>
        <div className="desktop-help">
          <span>
            <kbd>W</kbd>
            <span className="keys-row">
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </span>
          </span>
          <span>Gå runt</span>
          <i />
          <kbd>E</kbd>
          <span>Prata & upptäck</span>
          <i />
          <kbd>ESC</kbd>
          <span>Paus</span>
        </div>
        <span className="gentle-note">
          Ta äventyret i din takt <span>✦</span>
        </span>
      </footer>
    </>
  );
}
