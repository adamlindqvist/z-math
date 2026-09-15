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
          <path d="M49 110L53 49H88L92 110" fill="#39464a" />
          {[73, 86, 99].map((y) => (
            <g key={y}>
              <rect x="50" y={y} width="41" height="9" rx="3" fill="#b99a62" />
              <circle cx="56" cy={y + 4.5} r="2" fill="#847b65" />
              <circle cx="85" cy={y + 4.5} r="2" fill="#847b65" />
            </g>
          ))}
          <path d="M53 21L50 7M87 21L91 7" stroke="#39464a" strokeWidth="6" />
          <circle cx="50" cy="7" r="5" fill="#b99a62" />
          <circle cx="91" cy="7" r="5" fill="#b99a62" />
          <path d="M43 22L17 18L22 32L43 36M98 22L124 18L119 32L98 36" fill="#b99a62" />
          <rect x="40" y="17" width="62" height="51" rx="18" fill="#847b65" stroke="#b99a62" strokeWidth="3" />
          <rect x="44" y="48" width="54" height="25" rx="10" fill="#b99a62" />
          <rect x="65" y="19" width="11" height="10" rx="3" fill="#99eee3" />
          <circle cx="49" cy="56" r="2" fill="#39464a" />
          <circle cx="92" cy="56" r="2" fill="#39464a" />
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
