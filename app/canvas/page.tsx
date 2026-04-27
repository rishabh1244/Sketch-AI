
"use client";
import "@excalidraw/excalidraw/index.css";

import LLM from "../LLM/llm";
import Drawing from "../drawing/drawing";
import Navbar from "../navbar/navbar";
export default function Canvas() {
    return (
        <>
            <div >
                    <Navbar />

            <div >
                    <Drawing url={"api/diagram"} />
                </div>

                <div >

                    <LLM />
                </div>
            </div>
        </>
    );
}


