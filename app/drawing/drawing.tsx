"use client";
import { useState, useEffect, useRef } from "react";
import "@excalidraw/excalidraw/index.css";
import dynamic from "next/dynamic";

const Excalidraw = dynamic(
    () => import("@excalidraw/excalidraw").then(mod => mod.Excalidraw),
    { ssr: false }
);

interface DrawingProps {
    url?: string;
    data?: any;
    isEditMode?: boolean;
    onElementsChange?: (elements: any[]) => void;
}

export default function Drawing({ url, data: staticData, isEditMode = false, onElementsChange }: DrawingProps) {
    const [api, setApi] = useState<any>(null);
    const [diagram, setDiagram] = useState<any>(null);
    const elementsRef = useRef<any[]>([]);
    
    // Cache the heavy imports and compiled functions
    const excalidrawRef = useRef<any>(null);
    const compiledFnsRef = useRef<Map<string, { x?: Function; y?: Function }>>(new Map());
    const isUserEditingRef = useRef(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ── pre-compile govern functions once per element ─────────────
    const compileGovernFns = (elements: any[]) => {
        compiledFnsRef.current.clear();
        for (const el of elements) {
            if (el.obj_type !== "non_stationary") continue;
            const fns: { x?: Function; y?: Function } = {};
            if (el.govern_x) {
                try {
                    fns.x = new Function("state", "constants", "val",
                        `${el.govern_x}; return govern_x(val, state, constants);`) as Function;
                } catch (e) { console.error(`govern_x compile error for ${el.id}:`, e); }
            }
            if (el.govern_y) {
                try {
                    fns.y = new Function("state", "constants", "val",
                        `${el.govern_y}; return govern_y(val, state, constants);`) as Function;
                } catch (e) { console.error(`govern_y compile error for ${el.id}:`, e); }
            }
            compiledFnsRef.current.set(el.id, fns);
        }
    };

    // ── load excalidraw module once ───────────────────────────────
    useEffect(() => {
        import("@excalidraw/excalidraw").then(mod => {
            excalidrawRef.current = mod;
        });
    }, []);

    // ── data loading ──────────────────────────────────────────────
    useEffect(() => {
        if (staticData) {
            setDiagram(staticData);
            const els = JSON.parse(JSON.stringify(staticData.data?.elements || staticData.elements || []));
            elementsRef.current = els;
            compileGovernFns(els);
            return;
        }

        if (!url) return;

        const load = () => {
            fetch(url)
                .then(r => r.ok ? r.json() : null)
                .then(d => {
                    if (!d) return;
                    setDiagram(d);
                    const els = JSON.parse(JSON.stringify(d.data.elements));
                    elementsRef.current = els;
                    compileGovernFns(els);
                });
        };

        load();
        window.addEventListener("diagram-updated", load);
        return () => window.removeEventListener("diagram-updated", load);
    }, [staticData, url]);

    // Sync external constant updates without resetting simulation state
    useEffect(() => {
        if (!staticData) return;
        elementsRef.current = elementsRef.current.map(el => {
            const staticEl = (staticData.data?.elements || staticData.elements || []).find((s: any) => s.id === el.id);
            if (staticEl && staticEl.constants) {
                return { ...el, constants: { ...staticEl.constants } };
            }
            return el;
        });
    }, [staticData]);

    // ── initialize scene ──────────────────────────────────────────
    useEffect(() => {
        if (!api || !diagram || !excalidrawRef.current) return;
        if (isUserEditingRef.current) {
            // Skip updating scene to prevent cursor reset / lag during manual drag edits
            return;
        }
        const { convertToExcalidrawElements } = excalidrawRef.current;
        const elements = convertToExcalidrawElements(elementsRef.current);
        api.updateScene({ elements });
    }, [api, diagram]);

    // ── update edit mode in excalidraw appState dynamically ─────────
    useEffect(() => {
        if (!api) return;
        api.updateScene({
            appState: {
                viewModeEnabled: !isEditMode,
                zenModeEnabled: !isEditMode,
            }
        });
    }, [api, isEditMode]);

    // ── handle editMode deactivation & pending debounces ──────────────
    useEffect(() => {
        if (!isEditMode) {
            // Flush changes immediately when exiting edit mode
            if (isUserEditingRef.current) {
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
                if (onElementsChange) {
                    onElementsChange(elementsRef.current);
                }
                isUserEditingRef.current = false;
            }
        }
        
        return () => {
            // Clean up timer on unmount or mode toggle
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [isEditMode, onElementsChange]);

    // ── animation loop ────────────────────────────────────────────
    useEffect(() => {
        if (!api || !diagram) return;

        const waitAndStart = () => {
            if (!excalidrawRef.current) {
                setTimeout(waitAndStart, 50);
                return;
            }
            const { convertToExcalidrawElements } = excalidrawRef.current;

            let frameId: number;

            const tick = () => {
                // Do not animate/tick elements while the user is actively editing them manually
                if (isEditMode) {
                    frameId = requestAnimationFrame(tick);
                    return;
                }

                elementsRef.current = elementsRef.current.map(el => {
                    if (el.obj_type !== "non_stationary") return el;

                    const fns = compiledFnsRef.current.get(el.id);
                    if (!fns) return el;

                    const newX = fns.x ? fns.x(el.state || {}, el.constants || {}, el.x) : el.x;
                    const newY = fns.y ? fns.y(el.state || {}, el.constants || {}, el.y) : el.y;

                    return { ...el, x: newX, y: newY };
                });

                api.updateScene({
                    elements: convertToExcalidrawElements(elementsRef.current)
                });

                frameId = requestAnimationFrame(tick);
            };

            frameId = requestAnimationFrame(tick);
            return () => cancelAnimationFrame(frameId);
        };

        const cleanup = waitAndStart();
        return () => { cleanup?.(); };
    }, [api, diagram, isEditMode]);

    // Recalculates physical properties from hand-dragged layout modifications
    const syncConstantsFromPositions = (elements: any[]) => {
        let pivotCenter = { x: 440, y: 130 }; // fallback default
        let groundY = 500; // fallback default

        // Find reference coordinates from visual structures
        const pivotEl = elements.find(el => 
            el.id === "pivot" || 
            el.id.includes("pivot") || 
            el.id.includes("anchor") || 
            el.id.includes("center")
        );
        if (pivotEl) {
            pivotCenter = {
                x: pivotEl.x + (pivotEl.width || 0) / 2,
                y: pivotEl.y + (pivotEl.height || 0) / 2
            };
        }

        const groundEl = elements.find(el => 
            el.id === "ground" || 
            el.id.includes("ground") || 
            el.id.includes("floor") || 
            el.id.includes("shelf")
        );
        if (groundEl) {
            groundY = groundEl.y;
        }

        return elements.map(el => {
            if (el.obj_type !== "non_stationary") return el;
            
            const updatedConstants = { ...el.constants };
            const updatedState = { ...el.state };

            // Sync pivot coordinates
            if ("cx" in updatedConstants) updatedConstants.cx = pivotCenter.x;
            if ("cy" in updatedConstants) updatedConstants.cy = pivotCenter.y;
            if ("x0" in updatedConstants) updatedConstants.x0 = pivotCenter.x;
            if ("y0" in updatedConstants) updatedConstants.y0 = pivotCenter.y;

            // Sync ground coordinates
            if ("GROUND_Y" in updatedConstants) updatedConstants.GROUND_Y = groundY;
            if ("groundY" in updatedConstants) updatedConstants.groundY = groundY;
            if ("floorY" in updatedConstants) updatedConstants.floorY = groundY;

            // Update length L and angle theta if moving mass changes
            if (el.id.includes("bob") || el.id.includes("mass") || el.id.includes("ball")) {
                const elCenter = {
                    x: el.x + (el.width || 0) / 2,
                    y: el.y + (el.height || 0) / 2
                };

                if ("L" in updatedConstants) {
                    const dx = elCenter.x - pivotCenter.x;
                    const dy = elCenter.y - pivotCenter.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    updatedConstants.L = length;

                    if ("theta" in updatedState) {
                        updatedState.theta = Math.atan2(dx, dy);
                        updatedState.omega = 0; // Reset angular velocity
                    }
                }

                if ("A" in updatedConstants && "x0" in updatedConstants) {
                    updatedConstants.A = Math.abs(elCenter.x - updatedConstants.x0);
                }
            }

            // Sync ropes, strings, or springs endpoints to connect pivot to bob
            if (el.id.includes("string") || el.id.includes("rope") || el.id.includes("spring") || el.type === "line") {
                const bobEl = elements.find(b => b.id.includes("bob") || b.id.includes("mass") || b.id.includes("ball"));
                if (bobEl) {
                    const bobCenter = {
                        x: bobEl.x + (bobEl.width || 0) / 2,
                        y: bobEl.y + (bobEl.height || 0) / 2
                    };
                    el.x = pivotCenter.x;
                    el.y = pivotCenter.y;
                    el.points = [
                        [0, 0],
                        [bobCenter.x - pivotCenter.x, bobCenter.y - pivotCenter.y]
                    ];
                }
            }

            return {
                ...el,
                constants: updatedConstants,
                state: updatedState
            };
        });
    };

    const handleExcalidrawChange = (elements: readonly any[]) => {
        isUserEditingRef.current = true;
        
        // Apply physics-aware coordinate recalculations
        const syncedElements = syncConstantsFromPositions(elements as any[]);
        elementsRef.current = syncedElements;
        
        // Debounce parent updates to prevent React render loops during drags
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            if (onElementsChange) {
                onElementsChange(syncedElements);
            }
            isUserEditingRef.current = false;
        }, 300);
    };

    if (!diagram) return <div>No diagram yet. Submit a prompt first.</div>;

    return (
        <div style={{ height: "100vh" }}>
            <Excalidraw
                initialData={{
                    appState: {
                        viewModeEnabled: !isEditMode,
                        zenModeEnabled: !isEditMode,
                    }
                }}
                onChange={(elements) => {
                    if (isEditMode) {
                        handleExcalidrawChange(elements);
                    }
                }}
                theme="dark"
                excalidrawAPI={(api) => setApi(api)}
                renderTopRightUI={() => null}
                UIOptions={{
                    canvasActions: {
                        export: isEditMode ? undefined : false,
                        loadScene: isEditMode ? undefined : false,
                        saveToActiveFile: isEditMode ? undefined : false,
                        toggleTheme: false,
                        saveAsImage: isEditMode ? undefined : false,
                    }
                }}
            />
        </div>
    );
}
