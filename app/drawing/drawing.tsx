"use client";
import { useState, useEffect, useRef } from "react";
import "@excalidraw/excalidraw/index.css";
import dynamic from "next/dynamic";

const Excalidraw = dynamic(
    () => import("@excalidraw/excalidraw").then(mod => mod.Excalidraw),
    { ssr: false }
);

interface DrawingProps {
  url: string;
}

export default function Drawing({url}: DrawingProps) {
    const [api, setApi] = useState<any>(null);
    const [diagram, setDiagram] = useState<any>(null);
    const elementsRef = useRef<any[]>([]);

    // Fetch diagram.json from API route
    useEffect(() => {
            const load = () => {
                fetch(url)
                    .then(r => r.ok ? r.json() : null)
                    .then(data => {
                        if (!data) return;
                        setDiagram(data);
                        elementsRef.current = JSON.parse(JSON.stringify(data.data.elements));
                    });
            };
            load(); // initial load
            window.addEventListener("diagram-updated", load); // reload on new prompt
            return () => window.removeEventListener("diagram-updated", load);
            }, []);

    // Initialize scene once api and diagram are both ready
    useEffect(() => {
        if (!api || !diagram) return;
        import("@excalidraw/excalidraw").then(({ convertToExcalidrawElements }) => {
            const elements = convertToExcalidrawElements(elementsRef.current);
            api.updateScene({ elements });
        });
    }, [api, diagram]);

    useEffect(() => {
        if (!api || !diagram) return;

        const interval = setInterval(() => {
            import("@excalidraw/excalidraw").then(({ convertToExcalidrawElements }) => {
                elementsRef.current = elementsRef.current.map(el => {
                    if (el.obj_type !== "non_stationary") return el;

                    const state = el.state;
                    const constants = el.constants;

                    const evalFn = (fnStr: string, argName: string, argVal: number) => {
                        try {
                            const fn = new Function(
                                "state", "constants",
                                `${fnStr}; return ${argName === "x" ? "govern_x" : "govern_y"}(${argVal});`
                            );
                            return fn(state, constants);
                        } catch (e) {
                            console.error(`Error in ${argName} govern fn for ${el.id}:`, e);
                            return argVal;
                        }
                    };

                    const newX = el.govern_x ? evalFn(el.govern_x, "x", el.x) : el.x;
                    const newY = el.govern_y ? evalFn(el.govern_y, "y", el.y) : el.y;

                    return { ...el, x: newX, y: newY, state }; // state is mutated in place
                });

                const elements = convertToExcalidrawElements(elementsRef.current);
                api.updateScene({ elements });
            });
        }, 16); // ~60fps

        return () => clearInterval(interval);
    }, [api, diagram]);

    if (!diagram) return <div>No diagram yet. Submit a prompt first.</div>;

    return (
        <div style={{ height: "100vh" }}>
            <Excalidraw
                initialData={{
                    appState: {
                        viewModeEnabled: true,
                        zenModeEnabled: true
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
