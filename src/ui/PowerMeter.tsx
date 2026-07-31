import { useEffect, useRef, useState } from "react";
import { sfxClick } from "../audio/sfx";

/** Placement and pace are balanced inside this band. */
const SWEET_SPOT = { min: 0.58, max: 0.86 };

type Props = {
  onLock: (power: number) => void;
};

/**
 * A meter that sweeps back and forth until the player stops it. Too little
 * power lets the keeper hold it; too much and the strike sprays off target.
 */
export function PowerMeter({ onLock }: Props) {
  const [value, setValue] = useState(0);
  const [locked, setLocked] = useState(false);
  const valueRef = useRef(0);
  const lockedRef = useRef(false);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const period = 1150; // ms for a full up-and-down sweep

    const tick = (now: number) => {
      const t = ((now - start) % period) / period;
      // Triangle wave: sweeps up, then back down.
      const linear = t < 0.5 ? t * 2 : 2 - t * 2;
      valueRef.current = linear;
      setValue(linear);
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    const lock = () => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      cancelAnimationFrame(raf.current);
      setLocked(true);
      sfxClick();
      onLock(Math.max(0.08, valueRef.current));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        lock();
      }
    };

    // Anywhere on screen strikes the ball, except the controls that sit on top
    // of the pitch — those should still do their own job.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.(".sound-toggle, .btn--quit")) return;
      lock();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onLock]);

  const inSweet = value >= SWEET_SPOT.min && value <= SWEET_SPOT.max;

  return (
    <div className="power-meter" aria-live="off">
      <div className="power-meter__label">
        <span>Power</span>
        <strong className={inSweet ? "is-sweet" : undefined}>{Math.round(value * 100)}%</strong>
      </div>

      <div className="power-meter__track">
        <div
          className="power-meter__sweet"
          style={{
            left: `${SWEET_SPOT.min * 100}%`,
            width: `${(SWEET_SPOT.max - SWEET_SPOT.min) * 100}%`,
          }}
        />
        <div
          className={`power-meter__fill ${inSweet ? "is-sweet" : ""} ${locked ? "is-locked" : ""}`}
          style={{ width: `${value * 100}%` }}
        />
        <div className="power-meter__needle" style={{ left: `${value * 100}%` }} />
      </div>

      <p className="power-meter__hint">
        {locked ? "Struck!" : "Click or press Space to strike"}
      </p>
    </div>
  );
}
