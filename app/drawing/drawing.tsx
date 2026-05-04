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
}

export default function Drawing({ url, data: staticData }: DrawingProps) {
    const [api, setApi] = useState<any>(null);
    const [diagram, setDiagram] = useState<any>(null);
    const elementsRef = useRef<any[]>([]);
    // Cache the heavy imports and compiled functions — resolved once, reused every frame
    const excalidrawRef = useRef<any>(null);
    const compiledFnsRef = useRef<Map<string, { x?: Function; y?: Function }>>(new Map());

    // ── pre-compile govern functions once per element ─────────────
    const compileGovernFns = (elements: any[]) => {
        compiledFnsRef.current.clear();
        for (const el of elements) {
            if (el.obj_type !== "non_stationary") continue;
            const fns: { x?: Function; y?: Function } = {};
            if (el.govern_x) {
                try {
                    fns.x = new Function("state", "constants", `${el.govern_x}; return govern_x(arguments[2]);`) as any;
                    // Wrap properly
                    fns.x = new Function("state", "constants", "val",
                        `${el.govern_x}; return govern_x(val);`) as Function;
                } catch (e) { console.error(`govern_x compile error for ${el.id}:`, e); }
            }
            if (el.govern_y) {
                try {
                    fns.y = new Function("state", "constants", "val",
                        `${el.govern_y}; return govern_y(val);`) as Function;
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
            const els = JSON.parse(JSON.stringify(staticData.elements));
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

    // ── initialize scene ──────────────────────────────────────────
    useEffect(() => {
        if (!api || !diagram || !excalidrawRef.current) return;
        const { convertToExcalidrawElements } = excalidrawRef.current;
        const elements = convertToExcalidrawElements(elementsRef.current);
        api.updateScene({ elements });
    }, [api, diagram]);

    // ── animation loop ────────────────────────────────────────────
    useEffect(() => {
        if (!api || !diagram) return;

        // Wait for the module to be loaded before starting the loop
        const waitAndStart = () => {
            if (!excalidrawRef.current) {
                setTimeout(waitAndStart, 50);
                return;
            }
            const { convertToExcalidrawElements } = excalidrawRef.current;

            let frameId: number;

            const tick = () => {
                elementsRef.current = elementsRef.current.map(el => {
                    if (el.obj_type !== "non_stationary") return el;

                    const fns = compiledFnsRef.current.get(el.id);
                    if (!fns) return el;

                    const newX = fns.x ? fns.x(el.state, el.constants, el.x) : el.x;
                    const newY = fns.y ? fns.y(el.state, el.constants, el.y) : el.y;

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
    }, [api, diagram]);

    if (!diagram) return <div>No diagram yet. Submit a prompt first.</div>;

    return (
        <div style={{ height: "100vh" }}>
            <Excalidraw
                initialData={{
                    appState: {
                        viewModeEnabled: true,
                        zenModeEnabled: true,
                    }
                }}
                theme="dark"
                excalidrawAPI={(api) => setApi(api)}
                renderTopRightUI={() => null}
                UIOptions={{
                    canvasActions: {
                        export: false,
                        loadScene: false,
                        saveToActiveFile: false,
                        toggleTheme: false,
                        saveAsImage: false,
                    }
                }}
            />
        </div>
    );
}
