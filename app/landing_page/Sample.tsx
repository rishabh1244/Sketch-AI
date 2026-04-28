"use client";

import { useRef } from "react";
import styles from "./styles/sample.module.css";

const EXAMPLES = [
    {
        id: 1,
        slug: "pendulum",
        title: "Pendulum Motion",
        subtitle: "Simple Harmonic Motion",
        tag: "physics",
        gif: "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif",
        formula: "θ̈ + (g/L)sinθ = 0",
    },
    {
        id: 2,
        slug: "lorenz",
        title: "Lorenz Attractor",
        subtitle: "Chaos & Butterfly Effect",
        tag: "math",
        gif: "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
        formula: "dx/dt = σ(y−x)",
    },
    {
        id: 3,
        title: "Uranium Nucleus",
        slug: "nucleus",
        subtitle: "Atomic Orbital Model",
        tag: "physics",
        gif: "https://media.giphy.com/media/1AgBlEuMfBOocPjfW9/giphy.gif",
        formula: "E = mc²",
    },
    {
        id: 4,
        title: "Fourier Series",
        slug: "fourier",
        subtitle: "Wave Decomposition",
        tag: "engineering",
        gif: "https://media.giphy.com/media/xT9IgG50Lg7rusNZ6A/giphy.gif",
        formula: "f(x) = Σ aₙcos(nx)",
    },
    {
        id: 5,
        title: "Spring-Mass System",
        slug: "spring",

        subtitle: "Hooke's Law",
        tag: "physics",
        gif: "https://media.giphy.com/media/26uf2YTgF5upXUTm0/giphy.gif",
        formula: "F = −kx",
    },
    {
        id: 6,
        title: "Maxwell's Equations",
        slug: "maxwell-equation",

        subtitle: "Electromagnetic Fields",
        tag: "engineering",
        gif: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
        formula: "∇ × B = μ₀J",
    },
];

const TAG_COLORS: Record<string, string> = {
    physics: "rgba(120,200,255,0.18)",
    math: "rgba(200,150,255,0.18)",
    engineering: "rgba(120,255,180,0.18)",
};

export default function Sample() {
    const sectionRef = useRef<HTMLDivElement>(null);

    return (
        <section ref={sectionRef} id="examples" className={styles.section}>
            {/* section header */}
            <div className={styles.header}>
                <span className={styles.headerTag}>— examples —</span>

            </div>

            {/* cards grid */}
            <div className={styles.grid}>
                {EXAMPLES.map((ex, i) => (
                    <div
                        key={ex.id}
                        className={styles.card}
                        style={{ animationDelay: `${i * 0.07}s` }}
                        onClick={() => {
                            /* TODO: open in new window */
                            window.open(`/sample_page#${ex.slug}`, "_blank");
                        }}
                    >
                        {/* gif preview */}
                        <div className={styles.gifWrap}>
                            <img
                                src={ex.gif}
                                alt={ex.title}
                                className={styles.gif}
                                loading="lazy"
                            />
                            <div className={styles.gifOverlay} />

                            {/* formula watermark */}
                            <span className={styles.formulaWatermark}>{ex.formula}</span>

                            {/* open arrow */}
                            <button className={styles.openBtn} aria-label="Open example">
                                ↗
                            </button>
                        </div>

                        {/* card body */}
                        <div className={styles.body}>
                            <span
                                className={styles.tag}
                                style={{ background: TAG_COLORS[ex.tag] ?? "rgba(255,255,255,0.08)" }}
                            >
                                {ex.tag}
                            </span>
                            <h3 className={styles.cardTitle}>{ex.title}</h3>
                            <p className={styles.cardSub}>{ex.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* bottom fade */}
            <div className={styles.bottomFade} />
        </section>
    );
}
