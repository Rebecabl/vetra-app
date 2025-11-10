import * as React from "react";

type Props = React.SVGProps<SVGSVGElement>;

/** X (fechar) */
export const X = (p: Props) => (
  <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Mail */
export const Mail = (p: Props) => (
  <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="2" />
    <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

/** Lock */
export const Lock = (p: Props) => (
  <svg {...p} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

/** User */
export const User = (p: Props) => (
  <svg {...p} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" />
  </svg>
);

/** Eye (mostrar senha) */
export const Eye = (p: Props) => (
  <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

/** EyeOff (ocultar senha) */
export const EyeOff = (p: Props) => (
  <svg {...p} viewBox="0 0 24 24" fill="none">
    <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" />
    <path d="M3 6s4-4 9-4 9 4 9 4M3 18s4 4 9 4 9-4 9-4" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

/** Play */
export const Play = (p: Props) => (
  <svg {...p} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7-11-7z" />
  </svg>
);

/** Heart (favorito) — usa fill='currentColor' quando quiser preenchido */
export const Heart = (p: Props) => (
  <svg {...p} viewBox="0 0 24 24" fill="none">
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

/** Star (estrela) */
export const Star = (p: Props) => (
  <svg {...p} viewBox="0 0 24 24" fill="#FFD700">
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);
