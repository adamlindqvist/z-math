import { sound } from "../audio/sound";
import { Speech } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";

function dialogText(dialog: HTMLDivElement | null): string {
  if (!dialog) return "";
  const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (
      node.parentElement?.closest(
        'svg, [aria-hidden="true"], [data-read-aloud]',
      )
    )
      continue;
    const text = node.textContent?.trim();
    if (text) parts.push(text);
  }
  return parts
    .join(". ")
    .replace(/\+/g, " plus ")
    .replace(/=/g, " är lika med ");
}

export function ReadAloudButton({
  dialog,
}: {
  dialog: RefObject<HTMLDivElement | null>;
}) {
  const supported =
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined";
  // Keep the utterance alive until speech ends (including on Safari).
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const previousText = useRef("");
  const stop = () => {
    if (utterance.current) {
      utterance.current = null;
      window.speechSynthesis.cancel();
      sound.block("speech", false);
    }
  };

  useEffect(() => {
    const text = dialogText(dialog.current);
    if (text !== previousText.current) stop();
    previousText.current = text;
  });
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", hide);
    return () => {
      stop();
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  return (
    <button
      type="button"
      data-read-aloud
      className="absolute top-3 left-3 grid size-16 cursor-pointer touch-manipulation place-items-center rounded-[22px] bg-[#e4eddd] text-ink transition active:translate-y-[3px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-default disabled:opacity-45 motion-reduce:transition-none"
      aria-label="Läs upp"
      title={supported ? "Läs upp" : "Uppläsning stöds inte i denna webbläsare"}
      disabled={!supported}
      onClick={() => {
        stop();
        const speech = new SpeechSynthesisUtterance(dialogText(dialog.current));
        speech.lang = "sv-SE";
        speech.rate = 0.85;
        speech.volume = 0.45;
        const voice = window.speechSynthesis
          .getVoices()
          .find((v) => /^sv(?:[-_]|$)/i.test(v.lang));
        if (voice) speech.voice = voice;
        speech.onend = speech.onerror = () => {
          if (utterance.current === speech) {
            utterance.current = null;
            sound.block("speech", false);
          }
        };
        utterance.current = speech;
        sound.block("speech", true);
        try {
          window.speechSynthesis.speak(speech);
        } catch {
          stop();
        }
      }}
    >
      <Speech className="size-8" aria-hidden="true" />
    </button>
  );
}
