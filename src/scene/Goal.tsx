import { AnimatePresence, motion } from "framer-motion";
import { SCENE } from "./geometry";

const { left, right, top, line, postWidth } = SCENE.goal;

// The back of the goal sits further away, so it is drawn smaller and higher.
const BACK = { x0: 388, x1: 812, y0: 292, y1: 446 };

type Props = {
  /** Where the ball hit the net, retriggered by `key`. */
  bulge: { x: number; y: number; id: number } | null;
};

export function Goal({ bulge }: Props) {
  return (
    <g className="goal">
      <defs>
        <pattern id="net" width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M0 0 L9 9 M9 0 L0 9" stroke="#ffffff" strokeWidth="0.75" opacity="0.4" fill="none" />
        </pattern>
        <pattern id="netFine" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 0 L7 7 M7 0 L0 7" stroke="#ffffff" strokeWidth="0.65" opacity="0.32" fill="none" />
        </pattern>
        <linearGradient id="postShine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="35%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <radialGradient id="bulgeGlow">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The goal mouth reads as a dark cavity so the net and ball stand out */}
      <rect x={left} y={top} width={right - left} height={line - top} fill="#04101c" opacity="0.62" />
      <polygon
        points={`${BACK.x0},${BACK.y0} ${BACK.x1},${BACK.y0} ${BACK.x1},${BACK.y1} ${BACK.x0},${BACK.y1}`}
        fill="#020a14"
        opacity="0.45"
      />

      {/* Net surfaces: back, sides, roof and floor */}
      <polygon points={`${BACK.x0},${BACK.y0} ${BACK.x1},${BACK.y0} ${BACK.x1},${BACK.y1} ${BACK.x0},${BACK.y1}`} fill="url(#netFine)" />
      <polygon points={`${left},${top} ${BACK.x0},${BACK.y0} ${BACK.x0},${BACK.y1} ${left},${line}`} fill="url(#net)" opacity="0.85" />
      <polygon points={`${right},${top} ${BACK.x1},${BACK.y0} ${BACK.x1},${BACK.y1} ${right},${line}`} fill="url(#net)" opacity="0.85" />
      <polygon points={`${left},${top} ${right},${top} ${BACK.x1},${BACK.y0} ${BACK.x0},${BACK.y0}`} fill="url(#net)" opacity="0.7" />
      <polygon points={`${left},${line} ${BACK.x0},${BACK.y1} ${BACK.x1},${BACK.y1} ${right},${line}`} fill="url(#net)" opacity="0.5" />

      {/* Stanchion cables */}
      <g stroke="#e2e8f0" strokeWidth="1.6" opacity="0.35">
        <line x1={left} y1={top} x2={BACK.x0} y2={BACK.y0} />
        <line x1={right} y1={top} x2={BACK.x1} y2={BACK.y0} />
        <line x1={left} y1={line} x2={BACK.x0} y2={BACK.y1} />
        <line x1={right} y1={line} x2={BACK.x1} y2={BACK.y1} />
      </g>

      {/* Ball hitting the net */}
      <AnimatePresence>
        {bulge && (
          <motion.g key={bulge.id}>
            <motion.ellipse
              cx={bulge.x}
              cy={bulge.y}
              rx="54"
              ry="46"
              fill="url(#bulgeGlow)"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.25, 0.95, 1.05], opacity: [0, 0.9, 0.5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, times: [0, 0.18, 0.45, 1], ease: "easeOut" }}
              style={{ originX: `${bulge.x}px`, originY: `${bulge.y}px` }}
            />
            <motion.circle
              cx={bulge.x}
              cy={bulge.y}
              r="40"
              fill="url(#netFine)"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.5, 1.1], opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              style={{ originX: `${bulge.x}px`, originY: `${bulge.y}px` }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Frame */}
      <rect x={left - postWidth} y={top} width={postWidth} height={line - top + 2} rx="3" fill="url(#postShine)" />
      <rect x={right} y={top} width={postWidth} height={line - top + 2} rx="3" fill="url(#postShine)" />
      <rect
        x={left - postWidth}
        y={top - postWidth}
        width={right - left + postWidth * 2}
        height={postWidth}
        rx="3"
        fill="url(#postShine)"
      />

      {/* Contact shadow where the frame meets the grass */}
      <ellipse cx={left - 2} cy={line + 3} rx="16" ry="4" fill="#0b3d1f" opacity="0.4" />
      <ellipse cx={right + 2} cy={line + 3} rx="16" ry="4" fill="#0b3d1f" opacity="0.4" />
    </g>
  );
}
