"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import "@excalidraw/excalidraw/index.css";
import { ArrowLeft, Pencil, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import LLM from "../LLM/llm";
import Drawing from "../drawing/drawing";

// Dictionary of physics parameter descriptions
const PARAM_DEFINITIONS: Record<string, { definition: string; increase: string; decrease: string }> = {
    g: {
        definition: "Acceleration due to gravity (m/s²). Determines the downward pull on objects.",
        increase: "Increased gravity: Objects fall faster, pendulums oscillate quicker, bounce height decreases.",
        decrease: "Decreased gravity: Objects drift lighter, float longer, pendulums slow down."
    },
    dt: {
        definition: "Time step size (seconds per frame). Controls the speed of physical time simulation.",
        increase: "Larger step: Speeds up the simulation, but may cause collision clipping/unstability.",
        decrease: "Smaller step: Slows down the simulation, producing smoother and more precise motion."
    },
    L: {
        definition: "Length of the pendulum rod or cable (pixels).",
        increase: "Longer rod: Increases the period of oscillation (swings slower).",
        decrease: "Shorter rod: Decreases the period of oscillation (swings faster)."
    },
    r: {
        definition: "Radius of the circular body or trajectory orbit.",
        increase: "Larger radius: Increases size or expands orbit path width.",
        decrease: "Smaller radius: Decreases size or tightens orbit path width."
    },
    cx: {
        definition: "Center coordinates X-axis. Pivot point center for rotation or orbit.",
        increase: "Shift Right: Moves the rotation pivot/center rightward on the canvas.",
        decrease: "Shift Left: Moves the rotation pivot/center leftward on the canvas."
    },
    cy: {
        definition: "Center coordinates Y-axis. Pivot point center for rotation or orbit.",
        increase: "Shift Down: Moves the rotation pivot/center downward on the canvas.",
        decrease: "Shift Up: Moves the rotation pivot/center upward on the canvas."
    },
    k: {
        definition: "Spring stiffness constant (Hooke's Law). Controls spring tension/restoring force.",
        increase: "Stiffer spring: Shorter, faster bounces and quicker oscillations.",
        decrease: "Looser spring: Soft, slow oscillations and wider stretching."
    },
    e: {
        definition: "Coefficient of restitution. Determines elasticity and bounce energy conservation.",
        increase: "More elastic: Bounces higher, loses less kinetic energy on impact.",
        decrease: "Less elastic: Bounces lower, quickly settles to rest on impact."
    },
    A: {
        definition: "Amplitude of simple harmonic motion. Maximum displacement from equilibrium.",
        increase: "Larger amplitude: Wider sway paths or taller wave oscillations.",
        decrease: "Smaller amplitude: Narrower sways or shallower oscillations."
    },
    omega: {
        definition: "Angular frequency (rad/s). Controls rotational speed or wave speed.",
        increase: "Higher frequency: Rapid spinning, faster oscillation rate.",
        decrease: "Lower frequency: Slow spinning, relaxed oscillation rate."
    }
};

const getDefinition = (param: string) => {
    return PARAM_DEFINITIONS[param] || {
        definition: `Custom parameter '${param}' defined in this physics simulation.`,
        increase: `Increase to scale up the influence of '${param}' in the system equations.`,
        decrease: `Decrease to scale down the influence of '${param}' in the system equations.`
    };
};

// Advanced custom Markdown block and inline formatting parser
function renderMarkdown(text: string) {
    if (!text) return null;

    const parts: React.ReactNode[] = [];
    const regex = /```([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    let blockKey = 0;

    while ((match = regex.exec(text)) !== null) {
        // Text block before code
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText) {
            parts.push(
                <div key={`text-${blockKey++}`} className="space-y-2">
                    {parseTextLines(beforeText)}
                </div>
            );
        }

        // Code block
        const blockContent = match[1];
        const firstLineBreak = blockContent.indexOf("\n");
        const language = firstLineBreak !== -1 ? blockContent.slice(0, firstLineBreak).trim() : "";
        const codeText = firstLineBreak !== -1 ? blockContent.slice(firstLineBreak + 1) : blockContent;

        parts.push(
            <pre key={`code-${blockKey++}`} className="bg-black/50 border border-white/10 rounded-lg p-3 my-3 overflow-x-auto font-mono text-[11px] text-purple-300 leading-relaxed max-w-full">
                {language && <span className="block text-[9px] uppercase tracking-wider text-white/30 font-bold mb-1">{language}</span>}
                <code>{codeText.trim()}</code>
            </pre>
        );

        lastIndex = regex.lastIndex;
    }

    const afterText = text.slice(lastIndex);
    if (afterText) {
        parts.push(
            <div key={`text-${blockKey++}`} className="space-y-2">
                {parseTextLines(afterText)}
            </div>
        );
    }

    return parts;
}

function parseTextLines(text: string) {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
        const trimmed = line.trim();

        // Markdown Headers
        if (trimmed.startsWith("### ")) {
            return <h3 key={idx} className="text-sm font-bold text-white mt-4 mb-2">{parseInlineStyles(trimmed.substring(4))}</h3>;
        }
        if (trimmed.startsWith("## ")) {
            return <h2 key={idx} className="text-base font-bold text-white mt-5 mb-2 border-b border-white/5 pb-1">{parseInlineStyles(trimmed.substring(3))}</h2>;
        }
        if (trimmed.startsWith("# ")) {
            return <h1 key={idx} className="text-lg font-bold text-purple-400 mt-6 mb-3">{parseInlineStyles(trimmed.substring(2))}</h1>;
        }

        // Lists
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return <li key={idx} className="text-xs text-white/75 ml-4 list-disc my-1">{parseInlineStyles(trimmed.substring(2))}</li>;
        }

        // Blockquotes
        if (trimmed.startsWith("> ")) {
            return <blockquote key={idx} className="border-l-2 border-purple-500 pl-3 py-1 my-2 text-xs text-white/50 bg-white/5 rounded-r">{parseInlineStyles(trimmed.substring(2))}</blockquote>;
        }

        // Spacing
        if (!trimmed) {
            return <div key={idx} className="h-1" />;
        }

        // Plain text paragraph
        return <p key={idx} className="text-xs leading-relaxed text-white/85 mb-2">{parseInlineStyles(line)}</p>;
    });
}

// Inline parser for bold, code, etc.
function parseInlineStyles(text: string) {
    const parts: React.ReactNode[] = [];
    const inlineCodeRegex = /`([^`]+)`/g;
    let lastIdx = 0;
    let match;
    let styleKey = 0;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
        const textBefore = text.slice(lastIdx, match.index);
        if (textBefore) {
            parts.push(...parseBold(textBefore, styleKey++));
        }
        parts.push(
            <code key={`inline-c-${styleKey++}`} className="bg-white/10 px-1 py-0.5 rounded font-mono text-[10px] text-purple-300">
                {match[1]}
            </code>
        );
        lastIdx = inlineCodeRegex.lastIndex;
    }

    const textAfter = text.slice(lastIdx);
    if (textAfter) {
        parts.push(...parseBold(textAfter, styleKey++));
    }

    return parts.length > 0 ? parts : text;
}

function parseBold(text: string, baseKey: number): React.ReactNode[] {
    const boldParts = text.split("**");
    return boldParts.map((part, idx) => {
        if (idx % 2 === 1) {
            return <strong key={`bold-${baseKey}-${idx}`} className="font-bold text-purple-300">{part}</strong>;
        }
        return part;
    });
}

function CanvasContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");

    const [diagram, setDiagram] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Simulation constants state
    const [constants, setConstants] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);

    // AI Explanation streaming states
    const [explanationText, setExplanationText] = useState("");
    const [isExplanationOpen, setIsExplanationOpen] = useState(false);
    const [isExplaining, setIsExplaining] = useState(false);

    // Tooltip states
    const [hoveredParam, setHoveredParam] = useState<string | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);

    // Resizable sidebar panel width
    const [panelWidth, setPanelWidth] = useState(384);
    const isResizingRef = useRef(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const loadDiagram = async () => {
        if (!id) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`/api/diagram?id=${id}&t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setDiagram(data);
            }
        } catch (err) {
            console.error("Failed to load diagram:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDiagram();
        window.addEventListener("diagram-updated", loadDiagram);
        return () => window.removeEventListener("diagram-updated", loadDiagram);
    }, [id]);

    // Extract constants when diagram data changes
    useEffect(() => {
        if (!diagram?.data?.elements) return;
        const newConstants: Record<string, number> = {};
        for (const el of diagram.data.elements) {
            if (el.obj_type === "non_stationary" && el.constants) {
                for (const [k, v] of Object.entries(el.constants)) {
                    if (typeof v === "number") {
                        newConstants[k] = v;
                    }
                }
            }
        }
        setConstants(newConstants);
    }, [diagram]);

    // Smart Auto-scroll: Only stick to bottom if already scrolled near the bottom
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const threshold = 120; // px threshold from bottom
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;

        if (isAtBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }, [explanationText]);

    // Drag-to-resize mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizingRef.current) return;
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 280 && newWidth < window.innerWidth * 0.7) {
            setPanelWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    // Clean up drag event listeners
    useEffect(() => {
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    const handleConstantChange = (key: string, value: number) => {
        setConstants(prev => ({ ...prev, [key]: value }));

        // Propagate changes into the elements data structure so Drawing's animation loop picks them up
        setDiagram((prev: any) => {
            if (!prev?.data?.elements) return prev;
            const updatedElements = prev.data.elements.map((el: any) => {
                if (el.obj_type === "non_stationary" && el.constants && key in el.constants) {
                    return {
                        ...el,
                        constants: {
                            ...el.constants,
                            [key]: value
                        }
                    };
                }
                return el;
            });
            return {
                ...prev,
                data: {
                    ...prev.data,
                    elements: updatedElements
                }
            };
        });
    };

    const handleSaveConstants = async () => {
        if (!id || !diagram) return;
        setSaving(true);
        try {
            const res = await fetch("/api/diagram", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    data: diagram.data
                })
            });
            if (res.ok) {
                console.log("Constants and canvas changes successfully saved to DB");
            }
        } catch (err) {
            console.error("Failed to save diagram constants:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleClearCanvas = async () => {
        if (!id) return;
        if (!confirm("Are you sure you want to clear all elements from this canvas?")) return;

        // Reset local states to empty
        const emptyDiagram = {
            ...diagram,
            data: {
                elements: []
            }
        };
        setDiagram(emptyDiagram);
        setConstants({});

        // Persist empty drawing state to database
        try {
            await fetch("/api/diagram", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    data: { elements: [] }
                })
            });
        } catch (err) {
            console.error("Failed to clear canvas:", err);
        }
    };

    const handleResetSimulation = async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/diagram?id=${id}&t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setDiagram(data);
                console.log("Simulation successfully reset to last saved state");
            }
        } catch (err) {
            console.error("Failed to reset simulation:", err);
        }
    };

    const handleBack = () => {
        router.push("/dashboard");
    };

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a] text-white">
                <div className="flex flex-col items-center gap-3">
                    <span className="block h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white" />
                    <span className="text-sm text-white/60 font-medium">Loading canvas...</span>
                </div>
            </div>
        );
    }

    const hasElements = diagram?.data?.elements && diagram.data.elements.length > 0;

    // Full-screen loader only if the canvas has no elements (new diagram creation)
    if (generating && !hasElements) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a] text-white">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
                    <div className="relative">
                        <span className="block h-12 w-12 animate-spin rounded-full border-4 border-white/5 border-t-white" />
                        <span className="absolute inset-0 block h-12 w-12 animate-ping rounded-full border border-white/30 opacity-75" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Compiling Simulation</h3>
                        <p className="text-sm text-white/50 mt-1">AI is parsing equations, generating SVG paths, and binding physics laws...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!hasElements) {
        return (
            <div className="min-h-[calc(100vh-54px)] w-full bg-[#0a0a0a] flex flex-col items-center justify-center text-white relative pt-8 pb-16">
                {/* Back button */}
                <div className="absolute top-6 left-6">
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-white/60 hover:text-white hover:bg-white/5 cursor-pointer rounded-lg px-3 py-1.5 text-sm"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Dashboard</span>
                    </Button>
                </div>

                <LLM
                    sketchId={id}
                    layout="centered"
                    onStartLoading={() => setGenerating(true)}
                    onEndLoading={() => setGenerating(false)}
                    diagram={diagram}
                    isExplanationOpen={isExplanationOpen}
                    onToggleExplanation={setIsExplanationOpen}
                />
            </div>
        );
    }

    // Standard Excalidraw View + Controls Panel + Collapsible resizable sidebar + Bottom fixed input
    return (
        <div className="flex h-[calc(100vh-54px)] w-full bg-[#0a0a0a] overflow-hidden">
            {/* Main Canvas Area */}
            <div className="flex-1 h-full relative">
                {/* Back button and Edit toggle overlays */}
                <div className="absolute top-6 left-6 z-[90] flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-white/60 hover:text-white hover:bg-[#1a1a1a] bg-[#0d0d0d]/80 border border-white/10 cursor-pointer rounded-lg px-3 py-1.5 text-sm backdrop-blur-md"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Dashboard</span>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`flex items-center gap-2 text-xs font-semibold cursor-pointer rounded-lg px-3 py-1.5 border backdrop-blur-md transition-all ${isEditMode
                            ? "bg-purple-600/20 border-purple-500/50 text-purple-400"
                            : "bg-[#0d0d0d]/80 border-white/10 text-white/60 hover:text-white hover:bg-[#1a1a1a]"
                            }`}
                    >
                        {isEditMode ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        <span>{isEditMode ? "Exit Edit Mode" : "Edit Canvas"}</span>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleResetSimulation}
                        className="flex items-center gap-2 text-xs font-semibold cursor-pointer rounded-lg px-3 py-1.5 border border-white/10 bg-[#0d0d0d]/80 text-white/60 hover:text-white hover:bg-[#1a1a1a] backdrop-blur-md transition-all"
                        title="Reset simulation to last saved state"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Reset</span>
                    </Button>
                </div>

                {/* Simulation Parameter Controls Panel */}
                <div className="absolute top-20 left-6 z-[90] w-72 rounded-xl border border-white/10 bg-[#0d0d0d]/80 backdrop-blur-md p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                        <div className="min-w-0 flex-1 mr-2">
                            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider truncate">
                                {diagram?.name || "Simulation"}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearCanvas}
                                className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded"
                            >
                                Clear
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveConstants}
                                disabled={saving}
                                className="h-6 px-2 text-[10px] text-white/50 hover:text-white hover:bg-purple-600/20 border border-transparent hover:border-purple-500/30 rounded"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>

                    {Object.keys(constants).length === 0 ? (
                        <p className="text-[11px] text-white/40">No adjustable parameters found in this sketch.</p>
                    ) : (
                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                            {Object.entries(constants).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between text-xs relative">
                                    <span
                                        className="font-mono text-white/70 font-semibold cursor-help border-b border-dashed border-white/20 hover:text-purple-300 hover:border-purple-300 transition-colors"
                                        onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setHoveredParam(key);
                                            setHoveredPosition({ x: rect.right + 10, y: rect.top - 10 });
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredParam(null);
                                            setHoveredPosition(null);
                                        }}
                                    >
                                        {key}
                                    </span>
                                    <input
                                        type="number"
                                        step="any"
                                        value={val}
                                        onChange={(e) => {
                                            const num = parseFloat(e.target.value);
                                            if (!isNaN(num)) {
                                                handleConstantChange(key, num);
                                            }
                                        }}
                                        className="w-24 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-right font-mono text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-colors"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Drawing simulation */}
                <div className="h-full w-full">
                    <Drawing
                        data={diagram}
                        isEditMode={isEditMode}
                        onElementsChange={(updatedElements) => {
                            setDiagram((prev: any) => {
                                if (!prev) return prev;
                                return {
                                    ...prev,
                                    data: {
                                        ...prev.data,
                                        elements: updatedElements
                                    }
                                };
                            });
                        }}
                    />
                </div>

                {/* Non-disruptive centered load overlay when updating an existing diagram */}
                {generating && (
                    <div className="absolute inset-0 bg-[#0a0a0a]/35 backdrop-blur-[1px] z-[95] flex items-center justify-center pointer-events-none select-none">
                        <div className="bg-[#0d0d0d]/90 border border-purple-500/35 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                            <span className="block h-5 w-5 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-500" />
                            <div className="text-left">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compiling Modifications...</h4>
                                <p className="text-[10px] text-white/50">AI is updating physics equations and merging elements beside existing drawings...</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom-aligned overlay input */}
                <LLM
                    sketchId={id}
                    layout="bottom"
                    onStartLoading={() => setGenerating(true)}
                    onEndLoading={() => {
                        setGenerating(false);
                        setIsExplaining(false);
                    }}
                    diagram={diagram}
                    onExplanationStart={() => {
                        setExplanationText("");
                        setIsExplanationOpen(true);
                        setIsExplaining(true);
                    }}
                    onExplanationChunk={(text) => {
                        setExplanationText(prev => prev + text);
                    }}
                    isExplanationOpen={isExplanationOpen}
                    onToggleExplanation={setIsExplanationOpen}
                />
            </div>

            {/* Collapsible and Resizable Explanation Sidebar */}
            {isExplanationOpen && (
                <div
                    style={{ width: `${panelWidth}px` }}
                    className="border-l border-white/10 bg-[#0d0d0d] flex flex-col h-full z-[80] shadow-2xl relative"
                >
                    {/* Draggable handle on left edge */}
                    <div
                        onMouseDown={handleMouseDown}
                        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-purple-500/50 bg-transparent active:bg-purple-500 z-[95] transition-colors"
                    />

                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white tracking-wide">AI Explanation</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExplanationOpen(false)}
                            className="h-7 w-7 p-0 text-white/50 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
                        >
                            ✕
                        </Button>
                    </div>

                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                        {explanationText ? (
                            <div className="prose prose-invert max-w-none">
                                {renderMarkdown(explanationText)}
                            </div>
                        ) : isExplaining ? (
                            <div className="flex flex-col items-center justify-center h-48 text-white/40 gap-3">
                                <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                <span className="text-xs">Thinking...</span>
                            </div>
                        ) : (
                            <p className="text-xs text-white/45">Ask a question or request detail in the input box below.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Tooltip Popup */}
            {hoveredParam && hoveredPosition && (
                <div
                    className="fixed z-[100] w-64 p-3 bg-[#111]/95 border border-purple-500/30 rounded-lg shadow-xl text-xs backdrop-blur-sm text-white pointer-events-none"
                    style={{ left: hoveredPosition.x, top: hoveredPosition.y }}
                >
                    <h4 className="font-bold text-purple-400 font-mono mb-1">{hoveredParam}</h4>
                    <p className="text-white/80 leading-relaxed mb-2">{getDefinition(hoveredParam).definition}</p>
                    <div className="border-t border-white/5 pt-1.5 space-y-1">
                        <p className="text-[10px] text-green-400"><span className="font-bold">▲ Increase:</span> {getDefinition(hoveredParam).increase}</p>
                        <p className="text-[10px] text-red-400"><span className="font-bold">▼ Decrease:</span> {getDefinition(hoveredParam).decrease}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Canvas() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading canvas...</div>}>
            <CanvasContent />
        </Suspense>
    );
}
