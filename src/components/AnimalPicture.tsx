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
          {[30, 110].map((x) => (
            <g key={x}>
              <rect
                x={x - 23}
                y="15"
                width="46"
                height="65"
                rx="20"
                fill="#b39a64"
              />
              <circle
                cx={x}
                cy="47"
                r="19"
                fill="#35494e"
                stroke="#718985"
                strokeWidth="3"
              />
              <circle
                cx={x}
                cy="47"
                r="12"
                fill="none"
                stroke="#b39a64"
                strokeWidth="3"
                strokeDasharray="5 3"
              />
              <circle cx={x} cy="47" r="5" fill="#8cf1e7" />
            </g>
          ))}
          <rect
            x="37"
            y="8"
            width="66"
            height="66"
            rx="25"
            fill="#718985"
            stroke="#b39a64"
            strokeWidth="4"
          />
          <path
            d="M62 58V85Q62 101 82 94"
            fill="none"
            stroke="#35494e"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M62 58V85Q62 101 82 94"
            fill="none"
            stroke="#b39a64"
            strokeWidth="21"
            strokeDasharray="7 4"
          />
          <rect x="63" y="10" width="14" height="15" rx="4" fill="#b39a64" />
          <circle cx="70" cy="18" r="4" fill="#8cf1e7" />
          <circle cx="45" cy="57" r="3" fill="#b39a64" />
          <circle cx="95" cy="57" r="3" fill="#b39a64" />
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
