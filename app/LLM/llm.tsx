"use client";
import { useState } from "react";
import styles from "./llm.module.css";

export default function LLM() {
    const [prompt, setPrompt] = useState("");

    const handleSubmit = () => {
        if (!prompt.trim()) return;

        async function sendReq() {

            const output = await fetch('/api/llm', {
                method: "POST",
                body: JSON.stringify({
                    "prompt": prompt
                })
            })
            const data = await output.json();
            console.log(data);
            


        }
        sendReq();
        setPrompt("");
    };

    return (
        <div className={styles.sidebox}>
            <div className={styles.input_bar}>
                <textarea
                    placeholder="please enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
                <button className={styles.submit_button} onClick={handleSubmit}>
                    Send
                </button>
            </div>
        </div>
    );
}

