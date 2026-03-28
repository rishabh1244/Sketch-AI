
"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import "@excalidraw/excalidraw/index.css";


import Anim from "./anim";

import data from "./data/diagram.json"
import test from "./data/test.json";

const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    { ssr: false }
);

export default function App() {
    const [api, setApi] = useState<any>(null);
    const xRef = useRef(0);

    // Initialize the rectangle
    useEffect(() => {
        if (!api) return;
        import("@excalidraw/excalidraw").then(({ convertToExcalidrawElements }) => {
            const elements = convertToExcalidrawElements(test.elements);
            api.updateScene({ elements });
        });
    }, [api]);

    return (
        <>
        <div style={{ height: "100vh" }}>
        <Excalidraw theme="dark"
        initialData={{
            appState: {
                viewModeEnabled: true,
            },
        }}
        excalidrawAPI={(api) => setApi(api)} />
        </div>
                {/*
                    <Anim />

                    */}
        </>
    );
}


