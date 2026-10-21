export function AreaMiniMap({
  pins,
}: {
  pins: Array<{ x: number; y: number }>;
  tone: number;
}) {
  return (
    <svg className="home-mini" viewBox="0 0 320 120" aria-hidden="true">
      <rect width="320" height="120" fill="#eef0ec" />
      <path
        d="M0 78 C40 66 80 96 130 74 C180 52 220 92 270 70 C300 58 310 80 320 66 L320 120 L0 120 Z"
        fill="#dce9f1"
      />
      <path
        d="M0 78 C40 66 80 96 130 74 C180 52 220 92 270 70 C300 58 310 80 320 66"
        fill="none"
        stroke="#c5d5e2"
        strokeWidth="2"
      />
      {pins.map((pin, index) => (
        <g
          key={`${pin.x}-${pin.y}-${index}`}
          transform={`translate(${(pin.x / 100) * 320} ${(pin.y / 100) * 120})`}
        >
          <circle r="7" fill="#e86aa6" opacity="0.28" />
          <circle r="3.5" fill="#e86aa6" stroke="#ffffff" strokeWidth="1.2" />
        </g>
      ))}
    </svg>
  );
}

export const ANIME_GLYPH_COLORS = [
  "#fdeef5",
  "#fdeef5",
  "#fdeef5",
  "#fdeef5",
  "#fdeef5",
  "#fdeef5",
] as const;
