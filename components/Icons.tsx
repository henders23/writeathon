type P = { size?: number; color?: string; strokeWidth?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  "aria-hidden": true as const,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const Flame = ({ size = 22, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.3-4.8.3 1.6 1 2.6 2.2 3C11 8.5 11.5 5.5 12 3z" />
  </svg>
);
export const Grid = ({ size = 22, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    {[6, 12, 18].flatMap((y) => [6, 12, 18].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
  </svg>
);
export const Users = ({ size = 22, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16.5 14c2.3.2 4 1.7 4.5 4.5" />
  </svg>
);
export const Mic = ({ size = 20, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </svg>
);
export const MicOff = ({ size = 20, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M9 9v2a3 3 0 0 0 5.1 2.1M15 9.3V6a3 3 0 0 0-5.7-1.3M5.5 11a6.5 6.5 0 0 0 10.6 5M18.5 11c0 .8-.1 1.5-.4 2.2M12 17.5V21M4 4l16 16" />
  </svg>
);
export const Pause = ({ size = 16, color = "currentColor", strokeWidth = 2.2 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M8 5v14M16 5v14" />
  </svg>
);
export const PlayIcon = ({ size = 16, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M8 5.5v13l10.5-6.5z" />
  </svg>
);
export const Repeat = ({ size = 22, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />
  </svg>
);
export const Check = ({ size = 14, color = "currentColor", strokeWidth = 3 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);
export const Close = ({ size = 16, color = "currentColor", strokeWidth = 2 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const Search = ({ size = 18, color = "currentColor", strokeWidth = 2 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.3-4.3" />
  </svg>
);
export const Speaker = ({ size = 18, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M4 9.5v5h4l5 4v-13l-5 4zM16.5 9a4 4 0 0 1 0 6" />
  </svg>
);
export const Arrow = ({ size = 16, color = "currentColor", strokeWidth = 2 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const Share = ({ size = 18, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);
export const Snow = ({ size = 15, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />
  </svg>
);
export const Pen = ({ size = 20, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z" />
    <path d="M13.5 7l3.5 3.5" />
  </svg>
);
export const Bookmark = ({ size = 22, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />
  </svg>
);
export const Scissors = ({ size = 18, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <circle cx="6" cy="6.5" r="2.5" />
    <circle cx="6" cy="17.5" r="2.5" />
    <path d="M8.2 7.8 20 18M8.2 16.2 20 6" />
  </svg>
);
export const Eye = ({ size = 16, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);
export const Moon = ({ size = 18, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
);
export const Sun = ({ size = 18, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const Book = ({ size = 20, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
  </svg>
);
export const Plus = ({ size = 16, color = "currentColor", strokeWidth = 2 }: P) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Bulb = ({ size = 14, color = "currentColor", strokeWidth = 1.8 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
  </svg>
);
