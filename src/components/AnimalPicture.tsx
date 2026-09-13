export function AnimalPicture({
  kind,
  restored = false,
}: {
  kind: "elephant" | "giraffe";
  restored?: boolean;
}) {
  return (
    <svg viewBox="0 0 140 110" className="mx-auto h-28 w-36" aria-hidden="true">
      {kind === "elephant" ? (
        <>
          <ellipse cx="33" cy="47" rx="27" ry="35" fill="#a3adb9" />
          <ellipse cx="107" cy="47" rx="27" ry="35" fill="#a3adb9" />
          <ellipse cx="30" cy="48" rx="17" ry="23" fill="#ceafb0" />
          <ellipse cx="110" cy="48" rx="17" ry="23" fill="#ceafb0" />
          <ellipse cx="70" cy="43" rx="34" ry="36" fill="#a3adb9" />
          <path
            d="M61 58V86Q61 105 84 96"
            fill="none"
            stroke="#a3adb9"
            strokeWidth="19"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path d="M49 110L53 49H88L92 110" fill="#efc25c" />
          <path
            d="M60 77L74 70L81 82L68 89ZM75 102L84 92L89 105Z"
            fill="#a7753e"
          />
          <path
            d="M53 21L50 5M87 21L91 5"
            stroke="#73502f"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <ellipse cx="34" cy="28" rx="19" ry="9" fill="#efc25c" />
          <ellipse cx="107" cy="28" rx="19" ry="9" fill="#efc25c" />
          <rect x="40" y="17" width="62" height="51" rx="23" fill="#efc25c" />
          <ellipse cx="71" cy="58" rx="28" ry="15" fill="#f7d994" />
        </>
      )}
      <circle cx="55" cy="39" r="7" fill="#fff9e6" />
      <circle cx="86" cy="39" r="7" fill="#fff9e6" />
      <circle cx="55" cy="40" r="3.5" fill="#453b39" />
      <circle cx="86" cy="40" r="3.5" fill="#453b39" />
      {kind === "elephant" && (
        <>
          <path
            d="M14 108V83M14 98L5 91M14 94L24 84M123 108V81M123 96L112 88M123 93L135 85"
            fill="none"
            stroke={restored ? "#df83a0" : "#aebebb"}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle
            cx="14"
            cy="66"
            r="4"
            fill="none"
            stroke="#5faebc"
            strokeWidth="2"
          />
          <circle
            cx="127"
            cy="59"
            r="3"
            fill="none"
            stroke="#5faebc"
            strokeWidth="2"
          />
        </>
      )}
      {kind === "giraffe" && (
        <path
          d="M62 60Q71 68 80 60"
          fill="none"
          stroke="#73502f"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
