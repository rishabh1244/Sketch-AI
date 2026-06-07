"use client";

import { useRef } from "react";

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
        gif: "https://github.com/rishabh1244/rishabh1244/blob/main/lorenz.svg",
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
        slug: "shm",

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
        <section ref={sectionRef} id="examples" className="relative bg-[#0a0a0a] pt-24 px-8 pb-32 overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] before:bg-[size:40px_40px] before:pointer-events-none after:content-[''] after:absolute after:top-0 after:left-[8%] after:right-[8%] after:h-[1px] after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12)_20%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0.12)_80%,transparent)]">
            {/* section header */}
            <div className="relative z-[2] text-center mb-14">
                <span className="font-space-mono text-[11px] tracking-[0.18em] text-[rgba(255,255,255,0.25)] uppercase block mb-3">— examples —</span>
            </div>

            {/* cards grid */}
            <div className="relative z-[2] grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 max-w-[1100px] mx-auto">
                {EXAMPLES.map((ex, i) => (
                    <div
                        key={ex.id}
                        className="bg-[rgba(255,255,255,0.03)] border-[1.5px] border-[rgba(255,255,255,0.1)] rounded-[4px] overflow-hidden cursor-pointer relative transition-all duration-200 ease-in-out animate-card-in odd:-rotate-[0.4deg] even:rotate-[0.4deg] hover:rotate-0 hover:-translate-y-1 hover:border-[rgba(255,255,255,0.32)] hover:shadow-[4px_4px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.5)] group"
                        style={{ animationDelay: `${i * 0.07}s` }}
                        onClick={() => {
                            /* TODO: open in new window */
                            window.open(`/sample_page#${ex.slug}`, "_blank");
                        }}
                    >
                        {/* gif preview */}
                        <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#111]">
                            <img
                                src={ex.gif}
                                alt={ex.title}
                                className="w-full h-full object-cover grayscale-[30%] brightness-[75%] transition-all duration-250 ease-in-out group-hover:grayscale-0 group-hover:brightness-[90%] group-hover:scale-[1.04]"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,10,10,0.1)_0%,rgba(10,10,10,0.55)_100%)] pointer-events-none" />

                            {/* formula watermark */}
                            <span className="absolute bottom-2.5 left-3 font-space-mono text-[11px] text-[rgba(255,255,255,0.3)] tracking-[0.04em] pointer-events-none transition-colors duration-200 group-hover:text-[rgba(255,255,255,0.65)]">{ex.formula}</span>

                            {/* open arrow */}
                            <button className="absolute top-2.5 right-2.5 w-7 h-7 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] rounded-[3px] text-[rgba(255,255,255,0.5)] text-sm flex items-center justify-center cursor-pointer opacity-0 -translate-y-1 transition-all duration-180 ease-in-out group-hover:opacity-100 group-hover:translate-y-0 hover:bg-[rgba(255,255,255,0.18)] hover:text-white leading-none" aria-label="Open example">
                                ↗
                            </button>
                        </div>

                        {/* card body */}
                        <div className="pt-3.5 px-4 pb-4">
                            <span
                                className="font-space-mono text-[10px] tracking-[0.1em] uppercase text-[rgba(255,255,255,0.45)] py-0.5 px-2 rounded-[2px] border border-[rgba(255,255,255,0.1)] inline-block mb-2"
                                style={{ background: TAG_COLORS[ex.tag] ?? "rgba(255,255,255,0.08)" }}
                            >
                                {ex.tag}
                            </span>
                            <h3 className="font-caveat text-[22px] font-bold text-[rgba(255,255,255,0.9)] leading-[1.2] mb-0.5">{ex.title}</h3>
                            <p className="font-caveat text-[15px] text-[rgba(255,255,255,0.3)]">{ex.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-[linear-gradient(to_bottom,transparent,#0a0a0a)] pointer-events-none" />
        </section>
    );
}
