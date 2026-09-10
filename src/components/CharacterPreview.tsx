import { useEffect, useRef, useState } from "react";
import type { Equipment } from "../items/definitions";
import { CharacterPreviewScene } from "../game/CharacterPreviewScene";

export function CharacterPreview({
  equipment,
  trying,
}: {
  equipment: Equipment;
  trying?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<CharacterPreviewScene | null>(null);
  const drag = useRef<{ id: number; x: number } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = canvas.current!;
    let preview: CharacterPreviewScene | undefined;
    let observer: ResizeObserver | undefined;
    const cancel = () => {
      const id = drag.current?.id;
      drag.current = null;
      if (id !== undefined && element.hasPointerCapture?.(id))
        element.releasePointerCapture(id);
    };
    try {
      preview = new CharacterPreviewScene(element, () => {
        cancel();
        setFailed(true);
      });
      scene.current = preview;
      observer = new ResizeObserver(() => {
        const bounds = element.getBoundingClientRect();
        preview?.resize(bounds.width, bounds.height);
      });
      observer.observe(element);
    } catch {
      preview?.dispose();
      scene.current = null;
      setFailed(true);
    }
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      cancel();
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", cancel);
      observer?.disconnect();
      preview?.dispose();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    scene.current?.setEquipment(equipment);
  }, [equipment]);
  return (
    <section
      aria-label="Din gubbe"
      className="flex h-full min-h-0 flex-col items-center gap-2 rounded-[28px] border-4 border-white bg-cream p-3 text-center text-ink shadow-lg"
    >
      <p className="text-lg font-extrabold">
        {trying ? `Provar: ${trying}` : "Din gubbe"}
      </p>
      <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_center,#fff9e5,#dce8cf)]">
        <canvas
          ref={canvas}
          aria-label="Dra för att snurra gubben"
          className={`block h-full w-full touch-none ${failed ? "invisible" : "cursor-grab active:cursor-grabbing"}`}
          onPointerDown={(e) => {
            if (
              failed ||
              drag.current ||
              (e.pointerType === "mouse" && e.button !== 0)
            )
              return;
            e.preventDefault();
            drag.current = { id: e.pointerId, x: e.clientX };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (drag.current?.id !== e.pointerId) return;
            scene.current?.rotate(
              ((e.clientX - drag.current.x) /
                Math.max(e.currentTarget.clientWidth, 1)) *
                Math.PI *
                2,
            );
            drag.current.x = e.clientX;
          }}
          onPointerUp={(e) => {
            if (drag.current?.id !== e.pointerId) return;
            drag.current = null;
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
        />
        {failed && (
          <p
            role="status"
            className="absolute inset-0 grid place-items-center p-3 font-bold"
          >
            Gubben kunde inte visas
          </p>
        )}
      </div>
    </section>
  );
}
