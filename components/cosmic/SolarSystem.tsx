"use client";

import { useEffect, useRef, useState } from "react";
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
  /** Drift offset in pixels */
  driftX: number;
  driftY: number;
  focusedPlanet?: string | null;
}

function drawScene({ canvas, positions, driftX, driftY, focusedPlanet }: DrawParams) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Use logical (CSS) pixel dimensions — the animation loop sets ctx transform to DPR scale
  // so all drawing must be in logical space (0..offsetWidth, 0..offsetHeight)
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = "#0D1117";
  ctx.fillRect(0, 0, W, H);

  // Star field — seeded so it stays stable
  drawStars(ctx, W, H);

  // Center on Sun with drift applied
  const cx = W / 2 + driftX;
  const cy = H / 2 + driftY;

  // Scale: we want Neptune's orbit to fit within 85% of the shorter dimension
  const maxOrbitalRadius = ORBITAL_RADII["Neptune"] ?? 30;
  const viewRadius = Math.min(W, H) * 0.42;
  const scale = viewRadius / maxOrbitalRadius;

  // Draw orbital rings
  const orbitNames = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
  for (const name of orbitNames) {
    const r = (ORBITAL_RADII[name] ?? 1) * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Saturn's ring (artistic)
  const saturnPos = positions.find((p) => p.name === "Saturn");
  if (saturnPos) {
    const sx = cx + saturnPos.x * scale;
    const sy = cy - saturnPos.y * scale;
    const sr = PLANET_STYLE["Saturn"].radius;
    ctx.beginPath();
    ctx.ellipse(sx, sy, sr * 2.4, sr * 0.7, Math.PI / 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(226,212,160,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Sun
  const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
  sunGrad.addColorStop(0, "rgba(255,220,120,0.95)");
  sunGrad.addColorStop(0.5, "rgba(200,169,110,0.6)");
  sunGrad.addColorStop(1, "rgba(200,169,110,0)");
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fillStyle = sunGrad;
  ctx.fill();

  // Sun core
  const sunCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, 5);
  sunCore.addColorStop(0, "rgba(255,240,180,1)");
  sunCore.addColorStop(1, "rgba(220,180,90,0.9)");
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = sunCore;
  ctx.fill();

  // Planets
  for (const planet of positions) {
    const style = PLANET_STYLE[planet.name];
    if (!style) continue;

    // Top-down ecliptic: x = ecliptic x, y = -ecliptic y (canvas y flips)
    const px = cx + planet.x * scale;
    const py = cy - planet.y * scale;
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

  // Load planet positions once on mount
  useEffect(() => {
    try {
      const pos = getPlanetPositions(new Date());
      setPositions(pos);
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

      // Canvas logical size (pre-DPR)
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;

      // Temporarily reset transform for drawing in logical pixels
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const dpr = window.devicePixelRatio;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      drawScene({
        canvas,
        positions,
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
