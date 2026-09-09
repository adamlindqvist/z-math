import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sound } from "../audio/sound";

export function SoundButton() {
  const enabled = useSyncExternalStore(sound.subscribe, sound.getEnabled);
  const Icon = enabled ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      aria-pressed={enabled}
      className="mt-4 flex min-h-16 w-full cursor-pointer touch-manipulation items-center justify-center gap-3 rounded-[20px] bg-[#e8efdc] px-4 py-3 text-[21px] font-extrabold text-ink focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-teal"
      onClick={() => {
        sound.setEnabled(!enabled);
        if (!enabled) sound.unlock();
      }}
    >
      <Icon className="size-8 shrink-0" aria-hidden="true" />
      Ljudeffekter {enabled ? "på" : "av"}
    </button>
  );
}
