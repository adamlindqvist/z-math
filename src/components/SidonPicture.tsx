export function SidonPicture({ small = false }: { small?: boolean }) {
  return <svg viewBox="0 0 120 120" aria-hidden="true" className={small ? "h-12 w-12 shrink-0" : "mx-auto h-32 w-32"}>
    <circle cx="60" cy="60" r="57" fill="#dceeea" />
    <path d="M37 49Q26 76 29 109l14-9 33 6 18 7-10-57" fill="#76283e" />
    <path d="M24 117l5-23 23-11h16l23 11 5 23" fill="#ba3154" />
    <path d="M44 89l16 26 16-26-11-6H54z" fill="#e4efcf" />
    <path d="M49 94l11 18 11-18-11-7z" fill="#4fbfc2" />
    <path d="M36 98l14 19m34-19-14 19" stroke="#c5d2c6" strokeWidth="5" />
    <ellipse cx="60" cy="61" rx="26" ry="29" fill="#ba3154" />
    <path d="M40 54l5 24 15 12 15-12 5-24" fill="#e4efcf" />
    <path d="M38 47l-4 42 12-9-2-25m38-8 4 42-12-9 2-25" fill="#ba3154" />
    <path d="M54 34L51 13l8-9 9 13-3 19" fill="#c5d2c6" />
    <path d="M57 30l-2-16 4-6 5 10-2 13" fill="#586c6a" />
    <path d="M14 53L38 34l24-2 19 10 27-10-17 26-22 4-9-6-15 6z" fill="#ba3154" />
    <path d="M20 51l23-12 18-3" fill="none" stroke="#ec8495" strokeWidth="3" />
    <path d="M43 64l11-2-2 6h-7m22-6 10 2-2 4h-7" fill="#263b3d" />
    <ellipse cx="49" cy="65" rx="2.5" ry="3" fill="#e6c55e" />
    <ellipse cx="71" cy="65" rx="2.5" ry="3" fill="#e6c55e" />
    <path d="M47 73q13 16 26 0" fill="#263b3d" />
    <path d="M50 74l3 5 3-4 4 5 4-5 3 4 3-5" fill="#fff9e0" />
    <path d="M16 119V77m0 9L7 81l-2-11m11 16 9-5 2-11m-11 8V64" fill="none" stroke="#c5d2c6" strokeWidth="3" />
    <path d="M16 61l-4 10 4 5 4-5z" fill="#4fbfc2" />
  </svg>;
}
