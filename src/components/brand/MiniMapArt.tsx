/** Decorative map used in the how-to step. Gameplay uses the real guess map. */
export function MiniMapArt() {
  return (
    <svg
      viewBox="0 0 600 300"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "100%", background: "#13101f" }}
    >
      <ellipse cx="150" cy="105" rx="72" ry="30" fill="#15261d" />
      <polygon points="270,300 280,250 320,210 380,170 460,120 540,70 600,40 600,300" fill="#0b1d30" />
      <polyline
        points="280,250 320,210 380,170 460,120 540,70 600,40"
        fill="none"
        stroke="rgba(103,232,249,.35)"
        strokeWidth="1.5"
      />
      <rect x="24" y="28" width="26" height="18" rx="2" fill="#1b1830" />
      <rect x="70" y="40" width="22" height="16" rx="2" fill="#201c38" />
      <rect x="110" y="70" width="28" height="18" rx="2" fill="#1e1b35" />
      <rect x="40" y="120" width="24" height="16" rx="2" fill="#191629" />
      <rect x="160" y="150" width="26" height="18" rx="2" fill="#1b1830" />
      <rect x="210" y="90" width="22" height="16" rx="2" fill="#201c38" />
      <rect x="250" y="40" width="26" height="18" rx="2" fill="#1e1b35" />
      <path
        d="M0 186 C 150 165, 240 210, 372 144 S 480 45, 600 15"
        stroke="#3a3350"
        strokeWidth="7"
        fill="none"
      />
      <path d="M228 0 C 252 90, 198 180, 270 300" stroke="#2f2a45" strokeWidth="5" fill="none" />
      <g transform="translate(330,168)">
        <circle r="16" fill="#f9a8d4" opacity=".18" />
        <path d="M0 0 C -9 -10 -11 -14 -11 -20 A 11 11 0 0 1 11 -20 C 11 -14 9 -10 0 0Z" fill="#f9a8d4" />
        <circle cy="-20" r="4" fill="#0a0612" />
      </g>
    </svg>
  );
}
