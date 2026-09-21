export function RijuPicture({ small = false }: { small?: boolean }) {
  return <svg viewBox="0 0 120 120" aria-hidden="true" className={small ? "h-12 w-12 shrink-0" : "mx-auto h-32 w-32"}>
    <circle cx="60" cy="60" r="57" fill="#fff0bf" />
    <path d="M36 49Q12 80 29 106l27-14 36 15-6-57" fill="#b52c3c" />
    <circle cx="60" cy="28" r="19" fill="none" stroke="#e6b42d" strokeWidth="5" />
    <path d="M60 2v9M41 7l5 8M28 22l12 4M80 8l-5 8M91 23l-12 3" stroke="#e6b42d" strokeWidth="5" />
    <path d="M30 116l5-23 25-11 25 11 6 23" fill="#353b3c" />
    <path d="M45 90l15 22 15-22" fill="none" stroke="#f1c448" strokeWidth="6" />
    <ellipse cx="60" cy="63" rx="27" ry="30" fill="#bb792d" />
    <path d="M31 66Q29 29 60 30q33 0 29 36L78 45l-18-6-18 8z" fill="#b52c3c" />
    <path d="M35 47h50" stroke="#f1c448" strokeWidth="5" />
    <path d="M60 42l7 8-7 10-7-10z" fill="#38c0bc" stroke="#f1c448" strokeWidth="3" />
    <ellipse cx="48" cy="64" rx="8" ry="7" fill="#fff9eb" /><ellipse cx="72" cy="64" rx="8" ry="7" fill="#fff9eb" />
    <ellipse cx="49" cy="64" rx="4" ry="6" fill="#38c0bc" /><ellipse cx="71" cy="64" rx="4" ry="6" fill="#38c0bc" />
    <path d="M49 79q11 13 22 0" fill="#353b3c" />
    <circle cx="33" cy="77" r="5" fill="none" stroke="#f1c448" strokeWidth="3" /><circle cx="87" cy="77" r="5" fill="none" stroke="#f1c448" strokeWidth="3" />
    <path d="M60 95l7 9-7 10-7-10z" fill="#38c0bc" />
  </svg>;
}
