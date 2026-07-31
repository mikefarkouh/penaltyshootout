/** Original, simplified flag illustrations drawn as SVG. */

type Props = {
  code: string;
  width?: number;
  className?: string;
};

/**
 * A pared-back maple leaf: one point up, three lobes a side and the stem, so it
 * still reads as a leaf at the sizes the team cards use.
 */
const MAPLE_LEAF =
  "M0 -46 L9 -26 L21 -29 L15 -10 L35 -6 L20 6 L24 22 L8 18 L8 43 L-8 43 L-8 18 L-24 22 L-20 6 L-35 -6 L-15 -10 L-21 -29 L-9 -26 Z";

/** A regular pentagram with an outer radius of 1, one point up. */
const STAR =
  "M0 -1 L0.245 -0.337 L0.951 -0.309 L0.396 0.129 L0.588 0.809 L0 0.416 L-0.588 0.809 L-0.396 0.129 L-0.951 -0.309 L-0.245 -0.337 Z";

function Star({ x, y, r, fill = "#ffffff" }: { x: number; y: number; r: number; fill?: string }) {
  return <path d={STAR} fill={fill} transform={`translate(${x}, ${y}) scale(${r})`} />;
}

/** The 1:2 flag has an isosceles triangle inset from both edges; the row of
 * stars runs parallel to its hypotenuse and is clipped by the top and bottom. */
const BIH_STARS = Array.from({ length: 7 }, (_, i) => ({
  x: 25 + (i * 75) / 6,
  y: (i * 100) / 6,
}));

/** Thirteen stripes, the odd ones red, with the canton over the first seven. */
const USA_STRIPE = 100 / 13;
const USA_STARS = Array.from({ length: 7 }, (_, row) =>
  Array.from({ length: row % 2 === 0 ? 5 : 4 }, (_, col) => ({
    x: (row % 2 === 0 ? 7 : 13) + col * 12,
    y: 5 + row * 7.4,
  })),
).flat();

export function Flag({ code, width = 72, className }: Props) {
  const height = width * 0.66;
  const id = `flag-${code}`;

  return (
    <svg
      className={`flag ${className ?? ""}`}
      width={width}
      height={height}
      viewBox="0 0 150 100"
      role="img"
      aria-label={`${code} flag`}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x="0" y="0" width="150" height="100" rx="6" />
        </clipPath>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        {code === "FRA" && (
          <>
            <rect width="50" height="100" fill="#0b2f8f" />
            <rect x="50" width="50" height="100" fill="#ffffff" />
            <rect x="100" width="50" height="100" fill="#e1233a" />
          </>
        )}

        {code === "ESP" && (
          <>
            <rect width="150" height="100" fill="#c60b1e" />
            <rect y="25" width="150" height="50" fill="#ffc400" />
            {/* Abstract crest block, not a reproduction of the state arms */}
            <g transform="translate(44, 50)">
              <path d="M-13 -16 h26 v18 a13 16 0 0 1 -26 0 z" fill="#c60b1e" stroke="#8a0713" strokeWidth="1.6" />
              <path d="M-13 -16 h13 v34 h-6 a13 16 0 0 1 -7 -16 z" fill="#ffc400" opacity="0.9" />
              <rect x="-3" y="-22" width="6" height="8" rx="2" fill="#8a0713" />
            </g>
          </>
        )}

        {code === "ARG" && (
          <>
            <rect width="150" height="100" fill="#75aadb" />
            <rect y="33" width="150" height="34" fill="#ffffff" />
            <g transform="translate(75, 50)">
              {Array.from({ length: 16 }, (_, i) => (
                <path
                  key={i}
                  d="M0 -11 L2.6 -19 L0 -24 L-2.6 -19 Z"
                  fill="#f6b40e"
                  transform={`rotate(${i * 22.5})`}
                />
              ))}
              <circle r="11" fill="#f6b40e" stroke="#c8930b" strokeWidth="1.2" />
              <circle cx="-3.6" cy="-2" r="1.4" fill="#8a5a06" />
              <circle cx="3.6" cy="-2" r="1.4" fill="#8a5a06" />
              <path d="M-4 3.4 Q0 7 4 3.4" stroke="#8a5a06" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </g>
          </>
        )}

        {code === "ENG" && (
          <>
            <rect width="150" height="100" fill="#ffffff" />
            <rect x="63" width="24" height="100" fill="#ce1124" />
            <rect y="38" width="150" height="24" fill="#ce1124" />
          </>
        )}

        {code === "CAN" && (
          <>
            <rect width="150" height="100" fill="#d80621" />
            <rect x="37.5" width="75" height="100" fill="#ffffff" />
            <g transform="translate(75, 50) scale(0.9)">
              <path d={MAPLE_LEAF} fill="#d80621" />
            </g>
          </>
        )}

        {code === "BRA" && (
          <>
            <rect width="150" height="100" fill="#009c3b" />
            <path d="M75 8 L142 50 L75 92 L8 50 Z" fill="#ffdf00" />
            <circle cx="75" cy="50" r="21" fill="#002776" />
            {/* Simplified celestial band, not a copy of the motto scroll */}
            <path d="M56 55 Q75 42 94 57" fill="none" stroke="#ffffff" strokeWidth="5.5" />
            {[
              [66, 43],
              [77, 39],
              [85, 45],
              [71, 48],
              [61, 62],
              [82, 64],
            ].map(([x, y]) => (
              <Star key={`${x}-${y}`} x={x} y={y} r={2.1} />
            ))}
          </>
        )}

        {code === "USA" && (
          <>
            <rect width="150" height="100" fill="#ffffff" />
            {[0, 2, 4, 6, 8, 10, 12].map((i) => (
              <rect key={i} y={i * USA_STRIPE} width="150" height={USA_STRIPE} fill="#b31942" />
            ))}
            <rect width="60" height={USA_STRIPE * 7} fill="#0a3161" />
            {USA_STARS.map((s, i) => (
              <Star key={i} x={s.x} y={s.y} r={2.3} />
            ))}
          </>
        )}

        {code === "BIH" && (
          <>
            <rect width="150" height="100" fill="#002f87" />
            <path d="M42 0 L117 0 L117 100 Z" fill="#ffcc00" />
            {BIH_STARS.map((s, i) => (
              <Star key={i} x={s.x} y={s.y} r={7} />
            ))}
          </>
        )}

        <rect width="150" height="100" fill={`url(#${id}-sheen)`} />
      </g>
      <rect x="0.5" y="0.5" width="149" height="99" rx="6" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
    </svg>
  );
}
