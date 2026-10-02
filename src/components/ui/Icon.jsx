/**
 * Icon set (Lucide-style paths, 24×24, stroke-based).
 * Usage: <Icon name="calendar" size={18} />
 */
const PATHS = {
  home: ['m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75', { circle: [9, 7, 4] }],
  calendar: ['M16 2v4', 'M8 2v4', 'M3 10h18', { rect: [3, 4, 18, 18, 2] }],
  euro: ['M4 10h12', 'M4 14h9', 'M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2'],
  settings: ['M20 7h-9', 'M14 17H5', { circle: [17, 17, 3] }, { circle: [7, 7, 3] }],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  plus: ['M5 12h14', 'M12 5v14'],
  search: ['m21 21-4.3-4.3', { circle: [11, 11, 8] }],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  check: ['M20 6 9 17l-5-5'],
  left: ['m15 18-6-6 6-6'],
  right: ['m9 18 6-6-6-6'],
  up: ['m18 15-6-6-6 6'],
  down: ['m6 9 6 6 6-6'],
  sort: ['m7 15 5 5 5-5', 'm7 9 5-5 5 5'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  alert: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  mail: ['m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7', { rect: [2, 4, 20, 16, 2] }],
  pencil: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'],
  trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'],
  copy: ['M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2', { rect: [8, 8, 14, 14, 2] }],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
  columns: ['M9 3v18', 'M15 3v18', { rect: [3, 3, 18, 18, 2] }],
  printer: ['M6 9V2h12v7', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', { rect: [6, 14, 12, 8, 0] }],
  image: ['m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21', { rect: [3, 3, 18, 18, 2] }, { circle: [9, 9, 2] }],
  pin: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', { circle: [12, 10, 3] }],
  file: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10', 'm9 12 2 2 4-4'],
  userPlus: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M19 8v6', 'M22 11h-6', { circle: [9, 7, 4] }],
  briefcase: ['M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', { rect: [2, 7, 20, 14, 2] }],
};

export function Icon({ name, size = 18, strokeWidth = 2, color = 'currentColor', style, ...rest }) {
  const parts = PATHS[name] || [];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none', ...style }}
      aria-hidden="true"
      {...rest}
    >
      {parts.map((p, i) => {
        if (typeof p === 'string') return <path key={i} d={p} />;
        if (p.circle) return <circle key={i} cx={p.circle[0]} cy={p.circle[1]} r={p.circle[2]} />;
        const [x, y, w, h, rx] = p.rect;
        return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} />;
      })}
    </svg>
  );
}
