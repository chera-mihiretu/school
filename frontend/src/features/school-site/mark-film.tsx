"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/features/ui/cn";

const FILM_W = 1920;
const FILM_H = 1080;
const GROUND = "#13161d";
const INK = "#e9edf4";
const DIM = "#8d97ab";
const CREAM = "#f4efe4";
const BRICK = "#93312a";
const BRICK_DEEP = "#5e1d18";
const LINE = "#262b36";
const WARM = "#6f6a60";
const MONO = "var(--font-spline-mono), ui-monospace, monospace";
const SANS = "var(--font-bricolage), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), serif";

const NODE_R = 0.34375;
const NODE_H = 0.08125;
const HUB_H = 0.1125;
const RULE_IN = 0.1125;
const RULE_OUT = 0.2625;
const SW = 0.0688;

const SCHOOLS = [
  { id: "n", slug: "your-school", off: [0, -1] as const },
  { id: "e", slug: "your-subdomain", off: [1, 0] as const },
  { id: "s", slug: "your-campus", off: [0, 1] as const },
  { id: "w", slug: "your-site", off: [-1, 0] as const },
];

const SCENES = [
  { name: "Opening", dur: 3.2 },
  { name: "Addresses", dur: 4 },
  { name: "Collapse", dur: 3.6 },
  { name: "Hub", dur: 3.4 },
  { name: "Lockup", dur: 3.8 },
  { name: "Contexts", dur: 4.4 },
  { name: "Close", dur: 3.4 },
] as const;

const TOTAL = SCENES.reduce((sum, scene) => sum + scene.dur, 0);

const CUES = SCENES.reduce(
  (cues, scene) => {
    cues[scene.name] = cues._next;
    cues._next += scene.dur;
    return cues;
  },
  { _next: 0 } as Record<string, number>,
);

const A = CUES.Addresses;
const C = CUES.Collapse;
const HU = CUES.Hub;
const L = CUES.Lockup;
const X = CUES.Contexts;
const Z = CUES.Close;

function easeOutCubic(t: number) {
  const u = t - 1;
  return u * u * u + 1;
}

function easeInOutQuart(t: number) {
  if (t < 0.5) {
    return 8 * t * t * t * t;
  }
  const u = t - 1;
  return 1 - 8 * u * u * u * u;
}

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function tween(
  from: number,
  to: number,
  start: number,
  end: number,
  ease: (t: number) => number,
) {
  return (t: number) => {
    if (t <= start) {
      return from;
    }
    if (t >= end) {
      return to;
    }
    return from + (to - from) * ease((t - start) / (end - start));
  };
}

const enter = (from: number, to: number, start: number, end: number) =>
  tween(from, to, start, end, easeOutCubic);
const draw = (from: number, to: number, start: number, end: number) =>
  tween(from, to, start, end, easeInOutQuart);
const pop = (from: number, to: number, start: number, end: number) =>
  tween(from, to, start, end, easeOutBack);

function MarkGlyph({ size, color }: { size: number; color: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      style={{ display: "block", flex: "0 0 auto" }}
    >
      {SCHOOLS.map((school, index) => (
        <g key={school.id}>
          <line
            x1={16 + school.off[0] * 3.6}
            y1={16 + school.off[1] * 3.6}
            x2={16 + school.off[0] * 8.4}
            y2={16 + school.off[1] * 8.4}
            stroke={color}
            strokeWidth="2.2"
          />
          <rect
            x={16 + school.off[0] * 11 - 2.6}
            y={16 + school.off[1] * 11 - 2.6}
            width="5.2"
            height="5.2"
            rx="1.2"
            fill={color}
          />
        </g>
      ))}
      <rect x="12.4" y="12.4" width="7.2" height="7.2" rx="1.6" fill={color} />
    </svg>
  );
}

function FilmFrame({ time }: { time: number }) {
  let cx = draw(960, 660, L + 0.2, L + 1.6)(time);
  let cy = 540;
  let size = draw(520, 300, L + 0.2, L + 1.6)(time);
  if (time >= X) {
    cx = draw(660, 487, X + 0.1, X + 1.5)(time);
    cy = draw(540, 304, X + 0.1, X + 1.5)(time);
    size = draw(300, 88, X + 0.1, X + 1.5)(time);
  }
  if (time >= Z) {
    cx = draw(487, 960, Z + 0.3, Z + 1.7)(time);
    cy = draw(304, 470, Z + 0.3, Z + 1.7)(time);
    size = draw(88, 170, Z + 0.3, Z + 1.7)(time);
  }

  const markOp = enter(1, 0, Z + 1.8, Z + 2.6)(time);
  const hub = pop(0, 1, HU + 0.2, HU + 1.2)(time);
  const hostScale =
    time < X ? draw(1, 1.03, 0, A)(time) : draw(1.06, 1, Z + 1.6, TOTAL)(time);
  const hostOp =
    time < X
      ? enter(1, 0, A + 0.2, A + 1.0)(time)
      : enter(0, 1, Z + 1.6, Z + 2.6)(time);

  const labelX = 560;
  const labelY = [366, 478, 590, 702];
  const nodeHalf = NODE_H * size;
  const hubHalf = HUB_H * size;
  const stroke = SW * size;
  const radius = 0.05 * size;

  const lines = SCHOOLS.map((school, index) => {
    const inAt = A + 0.25 + 0.5 * index;
    const outAt = C + 0.15 + 0.4 * index;
    return {
      id: school.id,
      op:
        enter(0, 1, inAt, inAt + 0.7)(time) *
        enter(1, 0, outAt, outAt + 0.6)(time),
      dx: enter(-26, 0, inAt, inAt + 0.8)(time),
      y: labelY[index],
      slug: school.slug,
    };
  });

  const nodes = SCHOOLS.map((school, index) => {
    const progress = draw(
      0,
      1,
      C + 0.55 + 0.4 * index,
      C + 1.75 + 0.4 * index,
    )(time);
    const originX = labelX - 46;
    const originY = labelY[index] - 14;
    const targetX = cx + school.off[0] * NODE_R * size;
    const targetY = cy + school.off[1] * NODE_R * size;
    return {
      x: originX + (targetX - originX) * progress,
      y:
        originY +
        (targetY - originY) * progress -
        Math.sin(Math.PI * progress) * 42,
      scale: pop(0.68, 1, C + 0.2 + 0.4 * index, C + 0.95 + 0.4 * index)(time),
      op: enter(0, 1, C + 0.2 + 0.4 * index, C + 0.6 + 0.4 * index)(time),
    };
  });

  const rules = SCHOOLS.map((_, index) =>
    draw(0, 1, HU + 0.9 + 0.12 * index, HU + 2.0 + 0.12 * index)(time),
  );

  const wordmarkClip = draw(0, 480, L + 1.2, L + 2.7)(time);
  const wordmarkOp = time >= X ? enter(1, 0, X, X + 0.7)(time) : 1;

  const cards = [0.15, 1.0, 1.8, 2.5].map((delay, index) => {
    const t0 = X + delay;
    const out = Z + 0.1 + 0.22 * (3 - index);
    return {
      op: enter(0, 1, t0, t0 + 0.8)(time) * enter(1, 0, out, out + 0.8)(time),
      dy: enter(36, 0, t0, t0 + 0.9)(time) + enter(0, -28, out, out + 0.8)(time),
    };
  });

  const breathe = 1 + 0.014 * Math.sin((Math.PI * time) / TOTAL);
  const card = {
    position: "absolute" as const,
    left: 410,
    width: 1100,
    borderRadius: 10,
    overflow: "hidden" as const,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: GROUND,
        fontFamily: SANS,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${breathe})`,
          transformOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 494,
            width: FILM_W,
            textAlign: "center",
            opacity: hostOp,
            fontFamily: MONO,
            fontSize: 46,
            letterSpacing: "0.01em",
            color: DIM,
            transform: `scale(${hostScale})`,
            transformOrigin: "50% 50%",
          }}
        >
          your-school<span style={{ color: INK }}>.e-school.et</span>
        </div>

        {lines.map((line) => (
          <div
            key={line.id}
            style={{
              position: "absolute",
              left: labelX + line.dx,
              top: line.y - 30,
              opacity: line.op,
              fontFamily: MONO,
              fontSize: 42,
              color: DIM,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: INK }}>{line.slug}</span>.e-school.et
          </div>
        ))}

        <svg
          width={FILM_W}
          height={FILM_H}
          style={{ position: "absolute", inset: 0, zIndex: 3 }}
        >
          <g opacity={markOp}>
            {rules.map((factor, index) => {
              const offset = SCHOOLS[index].off;
              const inner = RULE_IN * size;
              const outer = inner + (RULE_OUT - RULE_IN) * size * factor;
              return (
                <line
                  key={SCHOOLS[index].id}
                  x1={cx + offset[0] * inner}
                  y1={cy + offset[1] * inner}
                  x2={cx + offset[0] * outer}
                  y2={cy + offset[1] * outer}
                  stroke={INK}
                  strokeWidth={stroke}
                />
              );
            })}
            <rect
              x={cx - hubHalf * hub}
              y={cy - hubHalf * hub}
              width={2 * hubHalf * hub}
              height={2 * hubHalf * hub}
              rx={radius * hub}
              fill={INK}
            />
            {nodes.map((node, index) => (
              <rect
                key={SCHOOLS[index].id}
                x={node.x - nodeHalf * node.scale}
                y={node.y - nodeHalf * node.scale}
                width={2 * nodeHalf * node.scale}
                height={2 * nodeHalf * node.scale}
                rx={radius * node.scale}
                fill={INK}
                opacity={node.op}
              />
            ))}
          </g>
        </svg>

        <div
          style={{
            position: "absolute",
            left: 826,
            top: 452,
            height: 176,
            width: wordmarkClip,
            overflow: "hidden",
            opacity: wordmarkOp,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 132,
              lineHeight: "176px",
              letterSpacing: "-0.04em",
              color: INK,
              whiteSpace: "nowrap",
            }}
          >
            School
          </div>
        </div>

        <div
          style={{
            ...card,
            top: 250,
            height: 108,
            background: GROUND,
            border: `1px solid ${LINE}`,
            opacity: cards[0].op,
            transform: `translateY(${cards[0].dy}px)`,
            display: "flex",
            alignItems: "center",
            gap: 22,
            paddingLeft: 152,
          }}
        >
          <span style={{ width: 1, height: 40, background: "#2c313d" }} />
          <span style={{ fontFamily: MONO, fontSize: 26, color: DIM }}>
            your-school.e-school.et
          </span>
        </div>

        <div
          style={{
            ...card,
            top: 424,
            height: 150,
            background: BRICK_DEEP,
            opacity: cards[1].op,
            transform: `translateY(${cards[1].dy}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 42px",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <MarkGlyph size={52} color={CREAM} />
            <span
              style={{
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 40,
                letterSpacing: "-0.03em",
                color: CREAM,
              }}
            >
              School
            </span>
          </span>
          <span
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 28,
              color: "#dcbfb6",
            }}
          >
            Every school on its own address.
          </span>
        </div>

        <div
          style={{
            ...card,
            top: 640,
            height: 132,
            background: CREAM,
            opacity: cards[2].op,
            transform: `translateY(${cards[2].dy}px)`,
            display: "flex",
            alignItems: "center",
            gap: 34,
            padding: "0 42px",
          }}
        >
          <MarkGlyph size={32} color={BRICK} />
          <MarkGlyph size={24} color={BRICK} />
          <MarkGlyph size={16} color={BRICK} />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 20,
              color: WARM,
              marginLeft: "auto",
            }}
          >
            32 / 24 / 16 px
          </span>
        </div>

        <div
          style={{
            ...card,
            top: 820,
            height: 96,
            background: CREAM,
            opacity: cards[3].op,
            transform: `translateY(${cards[3].dy}px)`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 42px",
          }}
        >
          <MarkGlyph size={18} color={WARM} />
          <span
            style={{
              fontFamily: SANS,
              fontSize: 24,
              letterSpacing: "0.02em",
              color: WARM,
            }}
          >
            Part of the School network
          </span>
        </div>
      </div>
    </div>
  );
}

function useAuthoredTime(total: number, playing: boolean) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!playing) {
      setTime(0);
      return;
    }

    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      setTime(((now - started) / 1000) % total);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, total]);

  return time;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function MarkFilm({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const reducedMotion = usePrefersReducedMotion();
  const time = useAuthoredTime(TOTAL, !reducedMotion);

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) {
      return;
    }

    const fit = (width: number) => {
      setScale(width / FILM_W);
    };
    fit(host.clientWidth);

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined) {
        fit(width);
      }
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      className={cn("relative w-full overflow-hidden bg-[#13161d]", className)}
      style={{ height: FILM_H * scale }}
      role="img"
      aria-label="The School mark assembling from four campus addresses"
    >
      <div
        className="pointer-events-none origin-top-left"
        style={{
          width: FILM_W,
          height: FILM_H,
          transform: `scale(${scale})`,
        }}
      >
        <FilmFrame time={time} />
      </div>
    </div>
  );
}
