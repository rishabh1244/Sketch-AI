"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./llm.module.css";

const MODELS = [
  { value: "google/gemini-2.0-flash-001", label: "gemini-2.0-flash" },
  { value: "qwen/qwen3-coder:free", label: "qwen3-coder" },
  { value: "nvidia/nemotron-3-super-120b-a12b:free", label: "nemotron" },
  { value: "z-ai/glm-4.5-air:free", label: "glm-4.5" },
];

export default function LLM() {
  const [prompt, setPrompt] = useState("");
  const [llm, setLlm] = useState(MODELS[0].value);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [prompt]);

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      await fetch("/api/llm", {
        method: "POST",
        body: JSON.stringify({ SKETCH_NAME:"UNTITLED", USER_CONCEPT: prompt, LLM: llm }),
      });
      window.dispatchEvent(new Event("diagram-updated"));
      setPrompt("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.floatingBar}>
      <div className={styles.inputWrapper}>

        {/* Textarea — grows with content */}
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Describe a concept or diagram…"
          value={prompt}
          rows={1}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {/* Bottom row: model selector + send */}
        <div className={styles.bottomRow}>
          <select
            className={styles.modelSelect}
            value={llm}
            onChange={(e) => setLlm(e.target.value)}
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            className={`${styles.sendBtn} ${loading ? styles.loading : ""}`}
            onClick={handleSubmit}
            disabled={!prompt.trim() || loading}
            aria-label="Send"
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
