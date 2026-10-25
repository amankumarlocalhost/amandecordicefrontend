// Lightweight inline icon set (1.5px strokes, matching the reference's line icons).

const PATHS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></>,
  bag: <><path d="M5 8h14l-1 12.5H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  menu: <><path d="M3.5 7h17M3.5 12h17M3.5 17h17" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  arrowRight: <><path d="M4 12h15" /><path d="m14 7 5 5-5 5" /></>,
  arrowLeft: <><path d="M20 12H5" /><path d="m10 7-5 5 5 5" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  star: <path d="m12 3.8 2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8L12 3.8Z" />,
  truck: <><path d="M3 6.5h11v9H3z" /><path d="M14 9.5h3.5l3 3v3H14" /><circle cx="7" cy="17.5" r="1.7" /><circle cx="17" cy="17.5" r="1.7" /></>,
  shield: <><path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6l-7-2.5Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  diamond: <><path d="M6.5 4h11l3.5 5-9 11L3 9l3.5-5Z" /><path d="M3 9h18M9 4l3 16 3-16" /></>,
  hand: <><path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12" /><path d="M11 11V5a1.5 1.5 0 0 1 3 0v6" /><path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 3.6-2.4 6.5-6 6.5-2.4 0-4-1.2-5.2-3.2L4 14.2a1.5 1.5 0 0 1 2.5-1.6L8 14.5" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  refresh: <><path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L20 9.5" /><path d="M20 4.5v5h-5" /><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1L4 14.5" /><path d="M4 19.5v-5h5" /></>,
  leaf: <><path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15" /><path d="M5 19c3-4 6-7 10-9" /></>,
  sparkle: <path d="M12 3.5 13.8 10 20.5 12l-6.7 2-1.8 6.5-1.8-6.5L3.5 12 10.2 10 12 3.5Z" />,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19c.9-3 3-4.6 5.5-4.6s4.6 1.6 5.5 4.6" /><circle cx="17" cy="9.5" r="2.5" /><path d="M16 14.6c2.3-.2 4 1.2 4.6 3.9" /></>,
  chat: <path d="M4.5 5.5h15v10h-9l-4.5 4v-4h-1.5z" />,
  send: <><path d="M4 12 20 4l-5 16-3.5-6.5L4 12Z" /><path d="m11.5 13.5 3-3" /></>,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="1" /><path d="m4 6.5 8 6 8-6" /></>,
  phone: <path d="M6.5 3.5h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />,
  pin: <><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  camera: <><path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z" /><circle cx="12" cy="13.5" r="3.5" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.5v.5" /></>,
  alert: <><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.5M12 17v.4" /></>,
  filter: <path d="M4 6.5h16M7 12h10M10 17.5h4" />,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r=".6" fill="currentColor" /></>,
  pinterest: <><circle cx="12" cy="12" r="8.5" /><path d="M11 9.5c0-1.4 1.1-2.2 2.3-2.2 1.6 0 2.5 1.2 2.5 2.7 0 2-1.1 3.6-2.7 3.6-.9 0-1.5-.7-1.3-1.5M11.5 11.5 9.5 20" /></>,
  facebook: <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V9a.5.5 0 0 1 .5-.5Z" />,
  logout: <><path d="M14.5 4.5h-8v15h8" /><path d="M11 12h9.5M17 8.5l3.5 3.5-3.5 3.5" /></>,
  gift: <><rect x="4" y="9" width="16" height="11" /><path d="M3 9h18v-2.5H3zM12 6.5V20" /><path d="M12 6.5C10 3 7 3.5 7 5.3S9.5 6.5 12 6.5c2.5 0 5-.4 5-1.2S14 3 12 6.5Z" /></>,
  upload: <><path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9" /><path d="M4.5 15v4.5h15V15" /></>,
  zoom: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M11 8.5v5M8.5 11h5" /></>,
};

export default function Icon({ name, size = 20, className = "", strokeWidth = 1.5, title, filled = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
