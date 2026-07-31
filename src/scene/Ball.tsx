import { SCENE } from "./geometry";

const R = SCENE.ballRadius;

/** Regular pentagon path centred on (cx, cy). */
function pentagon(cx: number, cy: number, radius: number, rotation = -90) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = ((rotation + i * 72) * Math.PI) / 180;
    return `${(cx + Math.cos(a) * radius).toFixed(2)},${(cy + Math.sin(a) * radius).toFixed(2)}`;
  });
  return `M${pts.join("L")}Z`;
}

/** The ball itself, drawn at the origin so the parent controls its flight. */
export function BallGraphic() {
  const rim = Array.from({ length: 5 }, (_, i) => {
    const a = ((-90 + 36 + i * 72) * Math.PI) / 180;
    return {
      x: Math.cos(a) * R * 0.82,
      y: Math.sin(a) * R * 0.82,
      rot: -90 + 36 + i * 72,
    };
  });

  return (
    <g>
      <defs>
        <radialGradient id="ballShade" cx="0.36" cy="0.3" r="0.78">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="62%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        <clipPath id="ballClip">
          <circle cx="0" cy="0" r={R} />
        </clipPath>
      </defs>

      {/* A dark rim keeps the ball readable against both the net and the grass */}
      <circle cx="0" cy="0" r={R + 1.2} fill="#0b1220" opacity="0.5" />
      <circle cx="0" cy="0" r={R} fill="url(#ballShade)" stroke="#334155" strokeWidth="1.4" />

      <g clipPath="url(#ballClip)" fill="#1f2937">
        <path d={pentagon(0, 0, R * 0.42)} />
        {rim.map((p, i) => (
          <path key={i} d={pentagon(p.x, p.y, R * 0.34, p.rot + 180)} opacity="0.92" />
        ))}
      </g>

      <g clipPath="url(#ballClip)" stroke="#334155" strokeWidth="1.1" fill="none" opacity="0.55">
        {rim.map((p, i) => (
          <line key={i} x1={p.x * 0.42} y1={p.y * 0.42} x2={p.x * 1.4} y2={p.y * 1.4} />
        ))}
      </g>

      {/* Highlight */}
      <ellipse cx={-R * 0.32} cy={-R * 0.38} rx={R * 0.3} ry={R * 0.2} fill="#ffffff" opacity="0.6" transform="rotate(-25)" />
    </g>
  );
}
