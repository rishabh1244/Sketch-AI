"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import "@excalidraw/excalidraw/index.css";
import data from "./data/ball.json"
const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    { ssr: false }
);
export default function Anim() {
    const [api, setApi] = useState<any>(null);
    const xRef = useRef(100);


    function update_x(x) {
        return x;
    }
    function update_y(y) {
        return y + 1;
    }

    // Initialize the rectangle
    useEffect(() => {
        if (!api) return;
        import("@excalidraw/excalidraw").then(({ convertToExcalidrawElements }) => {
            const elements = convertToExcalidrawElements(data.elements);
            api.updateScene({ elements });
        });
    }, [api]);

    // Animate using convertToExcalidrawElements on every tick
    useEffect(() => {
        if (!api) return;
        const interval = setInterval(() => {
            xRef.current += 1;

            import("@excalidraw/excalidraw").then(({ convertToExcalidrawElements }) => {

                const updatedArray = data.elements.map(item => {
                    if (item.obj_type == "non_stationary") {
                        console.log("found non_stationary object", item.id)
                        return {
                            ...item,
                            x: update_x(item.x),
                            y: update_y(item.y)
                        };
                    }
                    return item;
                })
                const elements = convertToExcalidrawElements(updatedArray);
                api.updateScene({ elements });
            });
        }, 16); // ~60fps

        return () => clearInterval(interval);
    }, [api]);

    return (
        <div style={{ height: "100vh" }}>
            <Excalidraw
                initialData={{
                    appState: {
                        viewModeEnabled: true,
                    },
                }}

                theme="dark" excalidrawAPI={(api) => setApi(api)} />
        </div>
    );
}

/*
    You are an assistant that generates Excalidraw element skeleton JSON strictly following the official Excalidraw element skeleton format.

Instructions:

* Output ONLY valid JSON (no explanations, no markdown, no comments)
* The output must be a single JSON object with:

  * "type": "excalidraw"
  * "elements": array of valid Excalidraw elements
  * "appState": include reasonable defaults (centered view)
* Each element must include all required fields such as:
  id, type, x, y, width, height, angle, strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, groupIds, frameId, roundness (if needed), seed, version, versionNonce, isDeleted, boundElements, updated, link, locked
* Use only valid element types: line, arrow, ellipse, rectangle, diamond, text
* Ensure all elements are properly connected visually (no gaps)

Layout Requirements:

* The entire diagram must be centered within a canvas roughly 800x600
* Keep spacing clean, aligned, and visually balanced
* Avoid overlapping elements
* Use straight lines for strings/ropes
* Ensure connections between components are continuous and realistic

Task:
Draw a neat and clean **Pulley System (Basic Mechanics Diagram)** using standard physics diagram conventions:

Include:

1. A fixed support (horizontal beam at the top)
2. A pulley represented using a circle (ellipse)
3. A rope passing over the pulley (using line elements)
4. Two masses hanging on either side of the pulley (rectangles or small boxes)
5. The rope must be continuous over the pulley and connected to both masses
6. Arrows showing direction of motion or forces (tension, weight)
7. Optional ground line at bottom

Text Labels:

* Label each component clearly:
  "Pulley"
  "Rope"
  "Mass m₁"
  "Mass m₂"
  "Tension T"
  "Weight mg"
* Place labels near respective components without overlap

Styling:

* Use consistent strokeColor for structure (e.g., dark gray or black)
* Use distinct colors for arrows (e.g., red for forces)
* Keep strokeWidth between 1 and 3
* Use readable font sizes (12–20)

Constraints:

* Ensure all coordinates place the diagram roughly centered
* Ensure all elements are visible within the canvas
* Ensure symmetry of the pulley system (balanced layout)
* Ensure rope follows a realistic path over the pulley

Output:
Return ONLY a valid JSON object representing the Excalidraw scene. Do not include any explanation or text outside JSON.

     */
