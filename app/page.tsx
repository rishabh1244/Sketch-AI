
"use client";
import "@excalidraw/excalidraw/index.css";
import Anim from "./animation/anim";
import LLM from "./LLM/llm";

import styles from "./page.module.css"
export default function App() {
    return (
        <>
            <div className={styles.content}>
                <div className={styles.anim}>

                    <Anim />
                </div>
                <div className={styles.llm}>

                    <LLM />
                </div>
            </div>
        </>
    );
}


