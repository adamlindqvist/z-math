export function StoryPicture({ kind }: { kind: "princess" | "chest" }) {
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true" className="h-24! w-[110px]!">
      {kind === "princess" ? (
        <>
          <path d="M25 80V44C25 2 95 2 95 44V80" fill="#edbc43" />
          <path d="M22 100Q24 70 60 70T98 100" fill="#bd72c3" />
          <ellipse cx="60" cy="48" rx="27" ry="31" fill="#ffdcac" />
          <path
            d="M31 39Q40 12 69 20L88 39Q87 5 54 10Q27 12 31 39"
            fill="#edbc43"
          />
          <path
            d="M40 20L35 3L51 11L60 0L69 11L85 3L80 20Z"
            fill="#ffcf4d"
            stroke="#996222"
            strokeWidth="3"
          />
          <circle cx="49" cy="47" r="3" fill="#35473b" />
          <circle cx="72" cy="47" r="3" fill="#35473b" />
          <path
            d="M50 61Q60 71 71 61"
            fill="none"
            stroke="#a75648"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="42" cy="57" r="5" fill="#f4a197" />
          <circle cx="79" cy="57" r="5" fill="#f4a197" />
        </>
      ) : (
        <>
          <path
            d="M15 48V37Q15 15 37 15H83Q105 15 105 37V48"
            fill="#de9954"
            stroke="#88552b"
            strokeWidth="4"
          />
          <rect
            x="15"
            y="47"
            width="90"
            height="43"
            rx="9"
            fill="#b97540"
            stroke="#88552b"
            strokeWidth="4"
          />
          <path
            d="M32 19V88M88 19V88M16 49H104"
            stroke="#ffd25c"
            strokeWidth="9"
          />
          <rect x="49" y="41" width="23" height="27" rx="6" fill="#ffda67" />
          <circle cx="60" cy="51" r="4" fill="#88552b" />
          <path d="M60 51V59" stroke="#88552b" strokeWidth="4" />
          <path
            d="M9 7V19M3 13H15M107 2V14M101 8H113"
            stroke="#e9ab26"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
