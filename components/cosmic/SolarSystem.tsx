"use client";

import { useEffect, useRef, useState } from "react";
import * as Astronomy from "astronomy-engine";
import { getPlanetPositions, ORBITAL_RADII, type PlanetPosition } from "@/lib/astronomy";

// Visual config per planet
const PLANET_STYLE: Record<string, { color: string; radius: number; glow: string }> = {
  Mercury: { color: "#8B909C", radius: 3, glow: "rgba(139,144,156,0.4)" },
  Venus:   { color: "#C9933A", radius: 4, glow: "rgba(201,147,58,0.4)" },
  Earth:   { color: "#3EB489", radius: 4, glow: "rgba(62,180,137,0.5)" },
  Mars:    { color: "#B85555", radius: 3.5, glow: "rgba(184,85,85,0.4)" },
  Jupiter: { color: "#C8A96E", radius: 7, glow: "rgba(200,169,110,0.35)" },
  Saturn:  { color: "#E2D4A0", radius: 6, glow: "rgba(226,212,160,0.3)" },
  Uranus:  { color: "#7DB8C8", radius: 5, glow: "rgba(125,184,200,0.3)" },
  Neptune: { color: "#4A6FA5", radius: 5, glow: "rgba(74,111,165,0.3)" },
  Pluto:   { color: "#6B5E7A", radius: 2.5, glow: "rgba(107,94,122,0.3)" },
};

interface DrawParams {
  canvas: HTMLCanvasElement;
  positions: PlanetPosition[];
  /** Logical canvas dimensions — passed explicitly to avoid stale DOM reads */
  W: number;
  H: number;
  /** Drift offset in pixels */
  driftX: number;
  driftY: number;
  focusedPlanet?: string | null;
}

// Map real AU distance to a visual radius using a power-law scale.
// r^0.45 keeps inner planets visually separated while outer planets stay in frame.
// Pluto (39.48 AU) anchors the outer edge so Pluto/Neptune are both in bounds.
const SCALE_POWER = 0.45;
const OUTER_ANCHOR_AU = ORBITAL_RADII["Pluto"] ?? 39.48;
const OUTER_ANCHOR_SCALED = Math.pow(OUTER_ANCHOR_AU, SCALE_POWER);

function visualRadius(au: number, viewRadius: number): number {
  return (Math.pow(Math.max(au, 0.001), SCALE_POWER) / OUTER_ANCHOR_SCALED) * viewRadius;
}

function drawScene({ canvas, positions, W, H, driftX, driftY, focusedPlanet }: DrawParams) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = "#0D1117";
  ctx.fillRect(0, 0, W, H);

  // Star field — seeded so it stays stable
  drawStars(ctx, W, H);

  // Center on Sun with drift applied
  const cx = W / 2 + driftX;
  const cy = H / 2 + driftY;

  // viewRadius: Neptune's scaled orbit fits within 42% of the shorter dimension
  const viewRadius = Math.min(W, H) * 0.42;

  // Draw orbital rings using the same power-law visual radii
  const orbitNames = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
  for (const name of orbitNames) {
    const r = visualRadius(ORBITAL_RADII[name] ?? 1, viewRadius);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Sun — dominant glowing anchor at center
  // Outer corona
  const coronaR = 36;
  const corona = ctx.createRadialGradient(cx, cy, 0, cx, cy, coronaR);
  corona.addColorStop(0,   "rgba(255,230,150,0.55)");
  corona.addColorStop(0.35,"rgba(255,180,60,0.25)");
  corona.addColorStop(0.7, "rgba(200,90,20,0.1)");
  corona.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.arc(cx, cy, coronaR, 0, Math.PI * 2);
  ctx.fillStyle = corona;
  ctx.fill();

  // Sun body
  const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
  sunGrad.addColorStop(0,   "rgba(255,255,220,1)");
  sunGrad.addColorStop(0.3, "rgba(255,230,120,1)");
  sunGrad.addColorStop(0.7, "rgba(220,140,40,0.95)");
  sunGrad.addColorStop(1,   "rgba(180,80,10,0.8)");
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fillStyle = sunGrad;
  ctx.fill();

  // Saturn's ring (artistic) — drawn before planets so planet renders on top
  const saturnPos = positions.find((p) => p.name === "Saturn");
  if (saturnPos) {
    const angle = Math.atan2(saturnPos.y, saturnPos.x);
    const vr = visualRadius(saturnPos.distanceAU, viewRadius);
    const sx = cx + vr * Math.cos(angle);
    const sy = cy - vr * Math.sin(angle);
    const sr = PLANET_STYLE["Saturn"].radius;
    ctx.beginPath();
    ctx.ellipse(sx, sy, sr * 2.4, sr * 0.7, Math.PI / 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(226,212,160,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Planets — placed at heliocentric angle, visual distance from power-law scale
  for (const planet of positions) {
    const style = PLANET_STYLE[planet.name];
    if (!style) continue;

    // Derive angle from real heliocentric ecliptic coords (vec.x, vec.y in AU)
    const angle = Math.atan2(planet.y, planet.x);
    const vr = visualRadius(planet.distanceAU, viewRadius);

    // Top-down ecliptic: canvas y is flipped relative to ecliptic y
    const px = cx + vr * Math.cos(angle);
    const py = cy - vr * Math.sin(angle);
    const isFocused = focusedPlanet === planet.name;

    // Glow
    const glowRadius = style.radius * (isFocused ? 5 : 3.5);
    const glow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
    glow.addColorStop(0, style.glow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Planet body
    ctx.beginPath();
    ctx.arc(px, py, style.radius, 0, Math.PI * 2);
    ctx.fillStyle = isFocused ? "#E8D8A8" : style.color;
    ctx.fill();

    // Planet label
    ctx.fillStyle = isFocused ? "#C8A96E" : "rgba(139,144,156,0.55)";
    ctx.font = `${isFocused ? "500" : "400"} 9px Inter, system-ui, sans-serif`;
    ctx.letterSpacing = "0.06em";
    ctx.fillText(planet.name, px + style.radius + 3, py + 3);
  }
}

// Stable star field using a simple seeded approach
function drawStars(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Use a deterministic pseudo-random sequence so stars don't move on re-render
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  const count = Math.floor((W * H) / 3000);
  for (let i = 0; i < count; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const size = rand() * 1.2 + 0.3;
    const opacity = rand() * 0.5 + 0.1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(226,228,234,${opacity.toFixed(2)})`;
    ctx.fill();
  }
}

interface SolarSystemProps {
  focusedPlanet?: string | null;
  className?: string;
}

export default function SolarSystem({ focusedPlanet, className = "" }: SolarSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState<PlanetPosition[]>([]);
  // Drift animation state
  const driftRef = useRef({ t: 0, x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  // Load planet positions once on mount — add Earth explicitly since it's excluded from
  // the PLANETS array in astronomy.ts (that module omits the observer's own body)
  useEffect(() => {
    try {
      const now = new Date();
      const pos = getPlanetPositions(now);

      // Compute Earth's heliocentric position directly
      const time = Astronomy.MakeTime(now);
      const vec = Astronomy.HelioVector(Astronomy.Body.Earth, time);
      const distanceAU = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
      const earthPos: PlanetPosition = {
        name: "Earth",
        longitude: 0,
        latitude: 0,
        distanceAU,
        orbitalRadius: ORBITAL_RADII["Earth"] ?? 1.0,
        x: vec.x,
        y: vec.y,
      };

      // Insert Earth between Venus and Mars
      const venusIdx = pos.findIndex((p) => p.name === "Venus");
      const withEarth = [...pos];
      withEarth.splice(venusIdx + 1, 0, earthPos);
      setPositions(withEarth);
    } catch (e) {
      console.error("Failed to get planet positions:", e);
    }
  }, []);

  // Resize canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Animation loop — 90s cosmic drift
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || positions.length === 0) return;

    const DRIFT_PERIOD = 90000; // ms
    const DRIFT_AMPLITUDE = 12; // px

    const loop = (timestamp: number) => {
      driftRef.current.t = timestamp;
      const phase = (timestamp % DRIFT_PERIOD) / DRIFT_PERIOD;
      // Smooth Lissajous-style drift
      const driftX = Math.sin(phase * Math.PI * 2) * DRIFT_AMPLITUDE;
      const driftY = Math.sin(phase * Math.PI * 2 * 0.7 + 1) * DRIFT_AMPLITUDE * 0.6;

      const dpr = window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }

      // Derive logical dimensions from the canvas pixel buffer — authoritative source
      // canvas.width was set by the resize handler as offsetWidth * dpr
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;

      // Reset transform to logical pixel space before every draw
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawScene({
        canvas,
        positions,
        W,
        H,
        driftX,
        driftY,
        focusedPlanet,
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [positions, focusedPlanet]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
