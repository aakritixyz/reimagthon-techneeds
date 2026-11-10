"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import defaultLogo from "@/assets/logo.png";

export type LogoOrbitProps = {
  /** Defaults to the original TechNeeds logo already in this project. */
  logoSrc?: string;
  className?: string;
};

const BLUE = "#3b6aa5";
const SESSION_KEY = "techneeds:logo-orbit:intro:v1";
const DRAW_MS = 1400;
const LOGO_START_MS = 2300;
const INTRO_MS = 2750;
const PULSE_MS = 1100;
let sessionFallback = false;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3;
const points = (radius: number, count: number, start: number, offset: number) =>
  Array.from({ length: count }, (_, index) => {
    const angle = (start + index * 360 / count) * Math.PI / 180;
    return { id: offset + index, x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
  });
const INNER_NODES = points(33, 3, -90, 0);
const OUTER_NODES = points(43, 2, -30, 3);
type Point = (typeof INNER_NODES)[number];

type NodeProps = {
  point: Point;
  small?: boolean;
  elapsed: MotionValue<number>;
  hover: MotionValue<number>;
  pulseAge: MotionValue<number>;
  pulseIndex: MotionValue<number>;
  glowId: string;
};

function OrbitNode({ point, small = false, elapsed, hover, pulseAge, pulseIndex, glowId }: NodeProps) {
  const entrance = useTransform(() => clamp((elapsed.get() - DRAW_MS - point.id * 150) / 300));
  const pulse = useTransform(() => pulseIndex.get() === point.id
    ? Math.sin(Math.PI * clamp(pulseAge.get() / PULSE_MS)) : 0);
  const scale = useTransform(() => 1 + 0.6 * pulse.get());
  const glowOpacity = useTransform(() => 0.23 + hover.get() * 0.22 + pulse.get() * 0.4);
  const lineOpacity = useTransform(() => {
    if (pulseIndex.get() !== point.id) return 0;
    const age = pulseAge.get();
    return 0.28 * clamp(age / 150) * (1 - clamp((age - 700) / 400));
  });
  const lineOffset = useTransform(() => pulseIndex.get() === point.id ? 1 - easeOut(pulseAge.get() / 450) : 1);
  return (
    <motion.g style={{ opacity: entrance }}>
      <motion.path
        d={`M ${point.x} ${point.y} L 50 50`}
        fill="none" stroke={BLUE} strokeWidth="0.8" vectorEffect="non-scaling-stroke"
        pathLength={1} strokeDasharray="1 1"
        style={{ opacity: lineOpacity, strokeDashoffset: lineOffset }}
      />
      <motion.g style={{ scale, transformOrigin: `${point.x}px ${point.y}px`, transformBox: "view-box" }}>
        <motion.circle cx={point.x} cy={point.y} r={small ? 1.7 : 2.2}
          fill={BLUE} filter={`url(#${glowId})`} style={{ opacity: glowOpacity }} />
        <circle cx={point.x} cy={point.y} r={small ? 0.62 : 0.88} fill={BLUE} />
      </motion.g>
    </motion.g>
  );
}

export default function LogoOrbit({ logoSrc = defaultLogo.src, className = "" }: LogoOrbitProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.15 });
  const reducedMotion = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(true);
  const id = useId().replace(/:/g, "");
  const maskId = `orbit-draw-${id}`;
  const gridId = `orbit-grid-${id}`;
  const glowId = `orbit-glow-${id}`;
  const decided = useRef(false);
  const wantsHover = useRef(false);
  const idleTime = useRef(0);
  const lastPulse = useRef(0);

  const elapsed = useMotionValue(0);
  const innerRotation = useMotionValue(0);
  const outerRotation = useMotionValue(0);
  const hover = useMotionValue(0);
  const pulseAge = useMotionValue(PULSE_MS);
  const pulseIndex = useMotionValue(-1);
  const drawOffset = useTransform(() => 1 - easeOut(elapsed.get() / DRAW_MS));
  const logoOpacity = useTransform(() => easeOut((elapsed.get() - LOGO_START_MS) / 450));
  const logoScale = useTransform(() => (0.9 + 0.1 * logoOpacity.get()) * (1 + 0.05 * hover.get()));
  const logoGlow = useTransform(() => logoOpacity.get() * (0.035 + 0.05 * hover.get()));

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      elapsed.set(INTRO_MS);
      innerRotation.set(0);
      outerRotation.set(0);
      hover.set(0);
      pulseIndex.set(-1);
      pulseAge.set(PULSE_MS);
      return;
    }
    if (!inView || !pageVisible || reducedMotion === null) return;

    if (!decided.current) {
      let seen = sessionFallback;
      try {
        seen = seen || sessionStorage.getItem(SESSION_KEY) === "1";
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch { /* Private browsing may block storage; retain a memory fallback. */ }
      sessionFallback = true;
      decided.current = true;
      if (seen) elapsed.set(INTRO_MS);
    }

    // Motion values update SVG transforms directly, without per-frame React renders.
    // A single clock also freezes the entrance, hover, and pulse timelines off-screen.
    let frameId = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(Math.max(now - previous, 0), 64);
      previous = now;
      const before = elapsed.get();
      elapsed.set(Math.min(INTRO_MS, before + delta));
      const target = wantsHover.current ? 1 : 0;
      hover.set(hover.get() + Math.sign(target - hover.get()) * Math.min(Math.abs(target - hover.get()), delta / 300));
      const activeDelta = Math.max(0, delta - Math.max(0, INTRO_MS - before));
      if (activeDelta > 0) {
        const speed = 1 + hover.get();
        innerRotation.set((innerRotation.get() + activeDelta * 360 / 28000 * speed) % 360);
        outerRotation.set((outerRotation.get() - activeDelta * 360 / 50000 * speed) % 360);
        idleTime.current += activeDelta;
        if (idleTime.current - lastPulse.current >= 4000) {
          lastPulse.current = idleTime.current;
          pulseIndex.set(Math.floor(Math.random() * 5));
          pulseAge.set(0);
        } else pulseAge.set(Math.min(PULSE_MS, pulseAge.get() + activeDelta));
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [inView, pageVisible, reducedMotion, elapsed, innerRotation, outerRotation, hover, pulseAge, pulseIndex]);

  return (
    <div ref={ref} role="img" aria-label="TechNeeds logo with orbiting network nodes"
      className={`relative aspect-square w-full h-full ${className}`}
      style={{ position: "relative", width: "100%", height: "100%", aspectRatio: "1 / 1", background: "transparent", isolation: "isolate" }}
      onPointerEnter={() => { wantsHover.current = true; }}
      onPointerLeave={() => { wantsHover.current = false; }}>
      <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false"
        style={{ display: "block", width: "100%", height: "100%", aspectRatio: "1 / 1" }}>
        <defs>
          <pattern id={gridId} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 H 0 V 10" stroke="#0b1b33" strokeOpacity="0.06" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </pattern>
          <filter id={glowId} x="-150%" y="-150%" width="400%" height="400%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
            {[33, 43].map(radius => <motion.circle key={radius} cx="50" cy="50" r={radius}
              fill="none" stroke="white" strokeWidth="2" pathLength={1} strokeDasharray="1 1"
              transform="rotate(-90 50 50)" style={{ strokeDashoffset: drawOffset }} />)}
          </mask>
        </defs>
        <rect width="100" height="100" fill={`url(#${gridId})`} />
        <motion.g style={{ rotate: innerRotation, transformOrigin: "50px 50px", transformBox: "view-box" }}>
          <circle cx="50" cy="50" r="33" stroke={BLUE} strokeOpacity="0.72" strokeWidth="1"
            strokeDasharray="1.2 2.3" vectorEffect="non-scaling-stroke" mask={`url(#${maskId})`} />
          {INNER_NODES.map(point => <OrbitNode key={point.id} point={point} elapsed={elapsed} hover={hover}
            pulseAge={pulseAge} pulseIndex={pulseIndex} glowId={glowId} />)}
        </motion.g>
        <motion.g style={{ rotate: outerRotation, transformOrigin: "50px 50px", transformBox: "view-box" }}>
          <circle cx="50" cy="50" r="43" stroke={BLUE} strokeOpacity="0.25" strokeWidth="1"
            strokeDasharray="0.7 2.5" vectorEffect="non-scaling-stroke" mask={`url(#${maskId})`} />
          {OUTER_NODES.map(point => <OrbitNode key={point.id} point={point} small elapsed={elapsed} hover={hover}
            pulseAge={pulseAge} pulseIndex={pulseIndex} glowId={glowId} />)}
        </motion.g>
        <motion.circle cx="50" cy="50" r="20" fill={BLUE} filter={`url(#${glowId})`} style={{ opacity: logoGlow }} />
        <motion.g style={{ opacity: logoOpacity, scale: logoScale, transformOrigin: "50px 50px", transformBox: "view-box" }}>
          <image href={logoSrc} x="30" y="30" width="40" height="40" preserveAspectRatio="xMidYMid meet" />
        </motion.g>
      </svg>
      <span className="pointer-events-none absolute font-mono text-[10px] tracking-widest uppercase"
        style={{ position: "absolute", top: "3%", left: "3%", pointerEvents: "none", color: BLUE, fontFamily: "var(--tn-mono, monospace)", fontSize: "10px", letterSpacing: "0.14em", lineHeight: 1.4 }}>FIG. 02</span>
      <span className="pointer-events-none absolute font-mono text-[10px] tracking-widest uppercase"
        style={{ position: "absolute", bottom: "3%", right: "3%", pointerEvents: "none", color: BLUE, fontFamily: "var(--tn-mono, monospace)", fontSize: "10px", letterSpacing: "0.14em", lineHeight: 1.4 }}>LEARN · BUILD · SHARE</span>
    </div>
  );
}
