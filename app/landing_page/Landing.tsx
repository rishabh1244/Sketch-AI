"use client";

import { useEffect, useRef } from "react";
import styles from "./styles/landing.module.css";
import { useRouter } from "next/navigation";
import Sample from "./Sample";
const MATH_LABELS = [
    { text: "dx/dt = σ(y−x)", x: 0.07, y: 0.13, drift: 0.3 },
    { text: "∇²φ = ρ/ε₀", x: 0.80, y: 0.09, drift: 0.4 },
    { text: "F = −kx", x: 0.87, y: 0.54, drift: 0.25 },
    { text: "e^(iπ)+1=0", x: 0.05, y: 0.80, drift: 0.35 },
    { text: "∮ B·dA = 0", x: 0.76, y: 0.87, drift: 0.28 },
    { text: "dy/dt = x(ρ−z)−y", x: 0.48, y: 0.06, drift: 0.2 },
    { text: "∑ 1/n² = π²/6", x: 0.13, y: 0.48, drift: 0.32 },
];

const PILL_LABELS = [
    "pendulum",
    "uranium nucleus",
    "spring-mass",
    "lorenz attractor",
    "fourier series",
    "your exam question? ",
];

/* ── canvas helpers ─────────────────────────────────────────── */

function roughLine(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    wobble = 1.2,
) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(2, Math.floor(Math.hypot(dx, dy) / 8));
    ctx.beginPath();
    ctx.moveTo(x1 + (Math.random() - 0.5) * wobble, y1 + (Math.random() - 0.5) * wobble);
    for (let i = 1; i <= steps; i++) {
        const tt = i / steps;
        ctx.lineTo(
            x1 + dx * tt + (Math.random() - 0.5) * wobble,
            y1 + dy * tt + (Math.random() - 0.5) * wobble,
        );
    }
}

function roughArc(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    startA: number,
    endA: number,
    wobble = 0.8,
) {
    const steps = Math.max(8, Math.floor(r * 0.9));
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
        const a = startA + (endA - startA) * (i / steps);
        const wr = r + (Math.random() - 0.5) * wobble;
        const x = cx + Math.cos(a) * wr;
        const y = cy + Math.sin(a) * wr;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
}

function hex2(val: number) {
    return Math.min(255, Math.max(0, Math.round(val))).toString(16).padStart(2, "0");
}

function precomputeLorenz(x0: number, y0: number, z0: number, n = 8000): number[][] {
    const s = 10, rr = 28, b = 8 / 3, dt = 0.005;
    let x = x0, y = y0, z = z0;
    const pts = [];
    for (let i = 0; i < n; i++) {
        const dx = s * (y - x), dy = x * (rr - z) - y, dz = x * y - b * z;
        x += dx * dt; y += dy * dt; z += dz * dt;
        pts.push([x, y, z]);
    }
    return pts;
}

/* ── component ──────────────────────────────────────────────── */

export default function Landing() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const maybeCtx = canvas.getContext("2d");
        if (!maybeCtx) return;
        const ctx: CanvasRenderingContext2D = maybeCtx;

        let W: number, H: number, t = 0, frame = 0, lorenzHead = 0, animId: number;

        const lorenzPts1 = precomputeLorenz(0.1, 0, 0);
        const lorenzPts2 = precomputeLorenz(0.101, 0, 0);
        const TRAIL = 2200;

        function resize() {
            const el = canvasRef.current;
            if (!el) return;
            W = el.width = window.innerWidth;
            H = el.height = window.innerHeight;
        }
        resize();
        window.addEventListener("resize", resize);

        /* projection */
        function lorenzXY(pt: number[], cx: number, cy: number, scale: number) {
            return [cx + pt[0] * scale, cy + pt[2] * scale - pt[1] * scale * 0.3];
        }

        /* ── draw calls ── */

        function drawGrid() {
            const step = 40;
            ctx.fillStyle = "rgba(255,255,255,0.06)";
            for (let x = 0; x < W; x += step)
                for (let y = 0; y < H; y += step) {
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
        }

        function drawLorenz(
            pts: number[][],
            cx: number,
            cy: number,
            scale: number,
            headOffset: number,
        ) {
            const end = Math.min(lorenzHead + headOffset, pts.length - 1);
            const start = Math.max(0, end - TRAIL);
            if (end < 2) return;
            for (let i = start + 1; i <= end; i++) {
                const age = (i - start) / TRAIL;
                const [x1, y1] = lorenzXY(pts[i - 1], cx, cy, scale);
                const [x2, y2] = lorenzXY(pts[i], cx, cy, scale);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = `#ffffff${hex2(age * 200)}`;
                ctx.lineWidth = age > 0.7 ? 1.2 : 0.5;
                ctx.stroke();
            }
            if (end > 0) {
                const [hx, hy] = lorenzXY(pts[end], cx, cy, scale);
                ctx.beginPath();
                ctx.arc(hx, hy, 3, 0, Math.PI * 2);
                ctx.fillStyle = "#fff";
                ctx.fill();
            }
        }

        function drawAtom(
            cx: number,
            cy: number,
            r: number,
            speed: number,
            phase: number,
            nElectrons: number,
        ) {
            ctx.save();
            ctx.translate(cx, cy); ctx.scale(1, 0.35); ctx.translate(-cx, -cy);
            roughArc(ctx, cx, cy, r, 0, Math.PI * 2, 1.5);
            ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(cx, cy); ctx.rotate(1.1); ctx.scale(1, 0.35); ctx.translate(-cx, -cy);
            roughArc(ctx, cx, cy, r * 0.8, 0, Math.PI * 2, 1.2);
            ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore();

            roughArc(ctx, cx, cy, 5, 0, Math.PI * 2, 0.5);
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fill();

            for (let e = 0; e < nElectrons; e++) {
                const a = t * speed + phase + (e / nElectrons) * Math.PI * 2;
                const ex = cx + Math.cos(a) * r;
                const ey = cy + Math.sin(a) * r * 0.35;
                for (let i = 5; i >= 1; i--) {
                    const ta = a - i * 0.18;
                    const tx = cx + Math.cos(ta) * r;
                    const ty = cy + Math.sin(ta) * r * 0.35;
                    ctx.beginPath();
                    ctx.arc(tx, ty, 2 * ((5 - i) / 5 + 0.3), 0, Math.PI * 2);
                    ctx.fillStyle = `#ffffff${hex2(((5 - i) / 5) * 120)}`;
                    ctx.fill();
                }
                ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = "#fff"; ctx.fill();
            }
        }

        function drawPendulum(px: number, py: number, len: number, speed: number, phase: number) {
            const a = Math.sin(t * speed + phase) * 0.55;
            const bx = px + Math.sin(a) * len;
            const by = py + Math.cos(a) * len;
            ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 1.5;
            roughLine(ctx, px, py, bx, by);
            ctx.stroke();
            roughArc(ctx, bx, by, 7, 0, Math.PI * 2, 1);
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fill();
        }

        function drawSpring(ax: number, ay1: number, speed: number, phase: number) {
            const coils = 9, coilW = 10;
            const ay2 = ay1 + 120 + Math.sin(t * speed + phase) * 22;
            const segH = (ay2 - ay1) / (coils * 2);
            ctx.beginPath();
            ctx.moveTo(ax, ay1);
            for (let i = 0; i < coils * 2; i++) {
                ctx.lineTo(
                    ax + (i % 2 === 0 ? coilW : -coilW) + (Math.random() - 0.5) * 1.5,
                    ay1 + segH * (i + 1) + (Math.random() - 0.5) * 1.5,
                );
            }
            ctx.lineTo(ax, ay2);
            ctx.strokeStyle = "rgba(255,255,255,0.65)"; ctx.lineWidth = 1.5; ctx.stroke();

            ctx.beginPath(); ctx.rect(ax - 9, ay2, 18, 18);
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();

            roughLine(ctx, ax - 16, ay1, ax + 16, ay1);
            ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2; ctx.stroke();
            for (let i = -12; i <= 12; i += 6) {
                roughLine(ctx, ax + i, ay1, ax + i - 5, ay1 - 5);
                ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1; ctx.stroke();
            }
        }

        function drawWave(y: number, freq: number, amp: number, phaseOff: number, alpha: number) {
            ctx.beginPath();
            for (let x = 0; x <= W; x += 4) {
                const wy = y + Math.sin(x * freq + t * 1.1 + phaseOff) * amp + (Math.random() - 0.5) * 0.5;
                x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
            }
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 1.2; ctx.stroke();
        }

        function drawFourier(cx: number, cy: number) {
            const terms = 5, maxR = 30;
            let px = cx, py = cy;
            for (let k = 1; k <= terms; k++) {
                const r = maxR / k;
                const angle = t * (2 * k - 1) * 0.7;
                const nx = px + Math.cos(angle) * r;
                const ny = py + Math.sin(angle) * r;
                roughArc(ctx, px, py, r, 0, Math.PI * 2, 0.6);
                ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 0.8; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny);
                ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1; ctx.stroke();
                px = nx; py = ny;
            }
            ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = "#fff"; ctx.fill();
        }

        function drawVectorField() {
            const step = 58;
            for (let x = step; x < W; x += step) {
                for (let y = step; y < H; y += step) {
                    const nx = x / W - 0.5;
                    const ny = y / H - 0.5;
                    const angle = Math.atan2(ny, nx) + t * 0.12;
                    const ex = x + Math.cos(angle) * 12;
                    const ey = y + Math.sin(angle) * 12;
                    roughLine(ctx, x, y, ex, ey, 0.5);
                    ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 0.7; ctx.stroke();
                    for (const sign of [1, -1]) {
                        const ha = angle + sign * Math.PI * 0.82;
                        ctx.beginPath();
                        ctx.moveTo(ex, ey);
                        ctx.lineTo(ex + Math.cos(ha) * 4, ey + Math.sin(ha) * 4);
                        ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.stroke();
                    }
                }
            }
        }

        function drawMathLabels() {
            ctx.font = "15px 'Caveat', cursive";
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            MATH_LABELS.forEach((l, i) => {
                const ox = Math.sin(t * l.drift + i) * 5;
                const oy = Math.cos(t * l.drift * 0.7 + i * 1.3) * 3;
                ctx.fillText(l.text, W * l.x + ox, H * l.y + oy);
            });
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            t += 0.018; frame++;

            drawGrid();
            drawVectorField();
            drawMathLabels();
            /*
              if (frame % 2 === 0 && lorenzHead < lorenzPts1.length - 1) lorenzHead += 3;
              drawLorenz(lorenzPts1, W * 0.28, H * 0.5, 5.5,   0);
              drawLorenz(lorenzPts2, W * 0.28, H * 0.5, 5.5, 400);
        
              drawAtom(W - 110, 120,      55, 0.9, 0,   2);
              drawAtom(W - 110, 120,      32, 1.4, 1.5, 1);
              drawAtom(100,     H - 130,  50, 0.7, 0.8, 2);
              drawAtom(100,     H - 130,  28, 1.2, 2.2, 1);
        
              drawPendulum(W - 80,  50, 85, 1.1, 0);
              drawPendulum(W - 44,  50, 65, 0.9, 1.2);
              drawPendulum(W - 116, 50, 55, 1.3, 2.1);
        
              drawSpring(50,     H * 0.20, 1.5, 0);
              drawSpring(W - 50, H * 0.28, 1.1, 1.0);
              drawFourier(W * 0.88, H * 0.28);
              drawFourier(W * 0.12, H * 0.32);
        */

            drawWave(H * 0.74, 0.011, 20, 0, 0.30);
            drawWave(H * 0.79, 0.008, 14, 1.2, 0.22);
            drawWave(H * 0.84, 0.015, 10, 2.5, 0.16);


            animId = requestAnimationFrame(draw);
        }

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (<>
        <div className={styles.root}>
            <canvas ref={canvasRef} className={styles.bg} />

            <div className={styles.hero}>

                <div className={styles.badge}>
                    <span className={styles.badgeDot} />
                    LLM × Animation Engine
                </div>

                {/* SVG logo — hatch pattern + outline only, no inline font/style attrs */}
                <div className={styles.logoWrap}>
                    <svg
                        className={styles.logoSvg}
                        viewBox="0 0 640 110"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-label="Sketch.ai"
                    >
                        <defs>
                            <pattern
                                id="hatch45"
                                patternUnits="userSpaceOnUse"
                                width="8"
                                height="8"
                            >
                                <line x1="0" y1="8" x2="8" y2="0" stroke="white" strokeWidth="1.8" />
                                <line x1="-2" y1="2" x2="2" y2="-2" stroke="white" strokeWidth="1.8" />
                                <line x1="6" y1="10" x2="10" y2="6" stroke="white" strokeWidth="1.8" />
                            </pattern>

                            <clipPath id="sketchClip">
                                {/* font-family resolved from .logoSvgText CSS class */}
                                <text className={styles.logoSvgText} x="2" y="96">Sketch</text>
                            </clipPath>
                        </defs>

                        {/* hatched fill clipped to letterforms */}
                        <rect
                            x="0" y="0" width="430" height="110"
                            fill="url(#hatch45)"
                            clipPath="url(#sketchClip)"
                        />

                        {/* stroke outline for crispness */}
                        <text
                            className={styles.logoSvgText}
                            x="2" y="96"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                        >
                            Sketch.ai
                        </text>


                        {/* blinking status dot */}
                        <circle cx="622" cy="22" r="7" fill="white">
                            <animate
                                attributeName="opacity"
                                values="1;0.15;1"
                                dur="2s"
                                repeatCount="indefinite"
                            />
                        </circle>
                    </svg>
                </div>

                <p className={styles.tagline}>
                    Turn any concept into a <strong>living diagram</strong>.<br />
                    Physics. Math . Movement.
                </p>

                <p className={styles.sub}>excalidraw · animations · motion</p>

                <div className={styles.ctaRow}>


                    <button
                        onClick={() => router.push("/canvas")}

                        className={styles.btnPrimary}>Generate a diagram →</button>
                    <button

                        className={styles.btnGhost}
                        onClick={() => document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })}

                    >See examples</button>
                </div>

                <div className={styles.pills}>
                    {PILL_LABELS.map((label) => (
                        <span key={label} className={styles.pill}>{label}</span>
                    ))}
                </div>
            </div>
        </div>
        <Sample></Sample>
        </>
    );
}
