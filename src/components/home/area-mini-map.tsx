const TONES = ["#f9a8d4", "#67e8f9", "#fb923c"] as const;

export function AreaMiniMap({
  pins,
  tone,
}: {
  pins: Array<{ x: number; y: number }>;
  tone: number;
}) {
  const color = TONES[tone % TONES.length] ?? TONES[0];
  return (
    <svg className="home-mini" viewBox="0 0 320 120" aria-hidden="true">
      <rect width="320" height="120" fill="#141028" />
      <path
        d="M0 78 C40 70 70 90 110 74 C150 58 180 88 230 68 C270 52 300 80 320 64"
        fill="none"
        stroke="#2c2647"
        strokeWidth="3"
      />
      <path
        d="M0 40 H320"
        fill="none"
        stroke="#67e8f9"
        strokeOpacity="0.35"
        strokeDasharray="4 6"
      />
      {pins.map((pin, index) => (
        <g key={`${pin.x}-${pin.y}-${index}`} transform={`translate(${(pin.x / 100) * 320} ${(pin.y / 100) * 120})`}>
          <circle r="7" fill={color} opacity="0.28" />
          <circle r="3.5" fill={color} stroke="#0a0612" strokeWidth="1.2" />
        </g>
      ))}
    </svg>
  );
}

export const ANIME_GLYPH_COLORS = [
  "#f9a8d4",
  "#67e8f9",
  "#c4b5fd",
  "#fdba74",
  "#86efac",
  "#fbcfe8",
] as const;
