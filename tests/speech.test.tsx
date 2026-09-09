import { sound } from "../src/audio/sound";
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Modal } from "../src/components/Dialogue";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let host: HTMLDivElement, root: Root;
const synth = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => [{ lang: "sv-SE" }]),
};
class Utterance {
  constructor(public text: string) {}
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("speechSynthesis", synth);
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const render = (text = "Vad är 1 + 2?") =>
  act(() =>
    root.render(
      <Modal label="Quiz">
        <h2>{text}</h2>
        <p>Tryck på rätt svar.</p>
        <svg>
          <title>Stjärna</title>
        </svg>
        <button aria-label="Stäng dialog" />
        <button>3</button>
      </Modal>,
    ),
  );
const read = () =>
  act(() =>
    host.querySelector<HTMLButtonElement>('[aria-label="Läs upp"]')!.click(),
  );
it("reads visible text in Swedish on demand, without icon labels or a hidden answer", () => {
  render();
  expect(synth.speak).not.toHaveBeenCalled();
  read();
  expect(synth.speak.mock.calls[0][0]).toMatchObject({
    text: "Vad är 1  plus  2?. Tryck på rätt svar.. 3",
    lang: "sv-SE",
    rate: 0.85,
    voice: { lang: "sv-SE" },
  });
});
it("also reads the action button outside the dialog card", () => {
  act(() =>
    root.render(
      <Modal label="Kistan" action={<button>Spela vidare</button>}>
        <h2>Du hittade skatten!</h2>
      </Modal>,
    ),
  );
  read();
  expect(synth.speak.mock.calls[0][0].text).toBe(
    "Du hittade skatten!. Spela vidare",
  );
});
it("restarts instead of queueing, stops on new text and on closing", () => {
  render();
  read();
  read();
  expect(synth.cancel).toHaveBeenCalledTimes(1);
  render("Nästa fråga");
  expect(synth.cancel).toHaveBeenCalledTimes(2);
  read();
  act(() => root.render(null));
  expect(synth.cancel).toHaveBeenCalledTimes(3);
});
it("stops when focus is lost and ignores completion of an old utterance", () => {
  render();
  read();
  const old = synth.speak.mock.calls[0][0];
  read();
  old.onend();
  act(() => window.dispatchEvent(new Event("blur")));
  expect(synth.cancel).toHaveBeenCalledTimes(2);
});
it("keeps the dialog usable without speech support", () => {
  vi.stubGlobal("speechSynthesis", undefined);
  render();
  expect(
    host.querySelector<HTMLButtonElement>('[aria-label="Läs upp"]')!.disabled,
  ).toBe(true);
  expect(document.activeElement?.getAttribute("aria-label")).toBe(
    "Stäng dialog",
  );
});

it("mutes effects only for the active utterance and restores after errors", () => {
  const block = vi.spyOn(sound, "block");
  render();
  read();
  const first = synth.speak.mock.calls[0][0];
  expect(block).toHaveBeenLastCalledWith("speech", true);
  read();
  first.onend();
  expect(block).toHaveBeenLastCalledWith("speech", true);
  synth.speak.mock.calls[1][0].onerror();
  expect(block).toHaveBeenLastCalledWith("speech", false);
  block.mockRestore();
});
