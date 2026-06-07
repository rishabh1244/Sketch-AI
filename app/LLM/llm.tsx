"use client";

import { useState, useRef, useEffect } from "react";

const MODELS = [
  { value: "google/gemini-2.0-flash-001", label: "gemini-2.0-flash" },
  { value: "qwen/qwen3-coder:free", label: "qwen3-coder" },
  { value: "nvidia/nemotron-3-super-120b-a12b:free", label: "nemotron" },
  { value: "z-ai/glm-4.5-air:free", label: "glm-4.5" },
  { value: "openai/gpt-oss-120b:free", label: "chatgpt oss 120b" },
];

const SUGGESTIONS = [
  { label: "🪐 Solar System", prompt: "A 2D orbit simulation of a sun and three planets moving under gravitational forces." },
  { label: "🧪 Simple Pendulum", prompt: "A simple gravity pendulum simulation with adjustable rod length and real-time angle oscillation." },
  { label: "🧬 Double Pendulum", prompt: "A chaotic double-jointed pendulum that traces its path in different colors." },
  { label: "🌀 Lorenz Attractor", prompt: "A Lorenz attractor Lorenz system tracing butterfly-shaped trajectory paths using differential equations." },
];

interface LLMProps {
  sketchId?: string | null;
  layout?: "centered" | "bottom";
  onStartLoading?: () => void;
  onEndLoading?: () => void;
  diagram?: any;
  onExplanationStart?: () => void;
  onExplanationChunk?: (chunk: string) => void;
  isExplanationOpen?: boolean;
  onToggleExplanation?: (open: boolean) => void;
}

export default function LLM({ 
  sketchId, 
  layout = "bottom", 
  onStartLoading, 
  onEndLoading, 
  diagram,
  onExplanationStart,
  onExplanationChunk,
  isExplanationOpen = false,
  onToggleExplanation
}: LLMProps) {
  const [prompt, setPrompt] = useState("");
  const [llm, setLlm] = useState(MODELS[0].value);
  const [loading, setLoading] = useState(false);
  const [askRelevant, setAskRelevant] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [prompt]);

  // Load saved model per canvas
  useEffect(() => {
    if (sketchId) {
      const saved = localStorage.getItem(`sketchai_model_${sketchId}`);
      if (saved) {
        setLlm(saved);
      }
    }
  }, [sketchId]);

  const handleModelChange = (value: string) => {
    setLlm(value);
    if (sketchId) {
      localStorage.setItem(`sketchai_model_${sketchId}`, value);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      if (onEndLoading) onEndLoading();
    }
  };

  const handleSubmit = async (overridePrompt?: string) => {
    const activePrompt = overridePrompt || prompt;
    if (!activePrompt.trim()) return;

    setLoading(true);
    
    // Create new abort controller signal
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const hasElements = diagram?.data?.elements && diagram.data.elements.length > 0;

    if (askRelevant && hasElements) {
      // Ask Relevant Explanation Mode (Streaming description next to current simulation)
      if (onExplanationStart) onExplanationStart();
      try {
        const response = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ 
            USER_CONCEPT: activePrompt, 
            LLM: llm,
            SKETCH_ID: sketchId,
            diagram_context: diagram
          }),
        });

        if (!response.ok) {
          throw new Error("Explanation request failed");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;

        let done = false;
        let buffer = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            buffer += chunk;
            
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const cleanLine = line.replace(/^data:\s*/, "").trim();
              if (!cleanLine || cleanLine === "[DONE]") continue;

              try {
                const parsed = JSON.parse(cleanLine);
                const text = parsed.choices?.[0]?.delta?.content || "";
                if (text && onExplanationChunk) {
                  onExplanationChunk(text);
                }
              } catch (e) {
                // Ignore partial JSON chunks
              }
            }
          }
        }
        setPrompt("");
      } catch (e: any) {
        if (e.name === "AbortError") {
          console.log("Explanation streaming aborted by user");
        } else {
          console.error(e);
        }
      } finally {
        setLoading(false);
        if (onEndLoading) onEndLoading();
      }
    } else {
      // Normal Diagram Generation Mode
      if (onStartLoading) onStartLoading();
      try {
        const response = await fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ 
            SKETCH_NAME: "UNTITLED", 
            USER_CONCEPT: activePrompt, 
            LLM: llm,
            SKETCH_ID: sketchId,
            existing_diagram: askRelevant ? diagram : null
          }),
        });
        if (response.ok) {
          window.dispatchEvent(new Event("diagram-updated"));
          setPrompt("");
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          console.log("Diagram generation aborted by user");
        } else {
          console.error(e);
        }
      } finally {
        setLoading(false);
        if (onEndLoading) onEndLoading();
      }
    }
  };

  if (layout === "centered") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">What would you like to simulate?</h2>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            Describe any physics concept, interactive simulation, or diagram and watch it draw itself.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 rounded-[16px] border border-white/10 bg-[#0d0d0d] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            className="w-full resize-none border-none bg-transparent px-1 py-0 text-[1rem] leading-[1.6] text-[#e0e0e0] outline-none min-h-[48px] max-h-[240px] overflow-y-auto placeholder-[#444] focus:ring-0"
            placeholder="Describe your simulation (e.g. 'A double pendulum with chaotic behavior tracing its path'...)"
            value={prompt}
            rows={2}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {/* Bottom row */}
          <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3">
            <select
              className="cursor-pointer appearance-none rounded-lg border border-white/10 bg-[#0d0d0d] py-[0.4rem] pl-[0.8rem] pr-8 text-[0.8rem] text-[#888] outline-none transition-colors duration-150 hover:border-white/20 hover:text-[#ccc] focus:border-white/20 bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%226%22%3E%3Cpath_d=%22M0_0l5_6_5-6z%22_fill=%22%23666%22/%3E%3C/svg%3E')] bg-[right_10px_center] bg-no-repeat"
              value={llm}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value} className="bg-[#0d0d0d] text-[#ccc]">
                  {m.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              {loading ? (
                <button
                  type="button"
                  className="flex h-[36px] px-4 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-red-600 text-white font-semibold transition-colors hover:bg-red-700 active:scale-95"
                  onClick={handleStop}
                >
                  Stop
                </button>
              ) : (
                <button
                  className="flex h-[36px] px-4 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-[#e0e0e0] text-[#111] text-sm font-semibold transition-all duration-150 hover:scale-[1.03] hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
                  onClick={() => handleSubmit()}
                  disabled={!prompt.trim()}
                >
                  <span className="flex items-center gap-1.5">
                    Generate <SendIcon />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Suggestions Grid */}
        <div className="w-full">
          <p className="text-xs text-white/40 mb-3 text-center uppercase tracking-wider font-semibold">Try these suggestions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                className="text-left p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-xs text-white/80 hover:text-white flex flex-col gap-1 cursor-pointer group"
                onClick={() => {
                  setPrompt(s.prompt);
                  handleSubmit(s.prompt);
                }}
              >
                <span className="font-bold text-white/95 group-hover:text-purple-400 transition-colors">{s.label}</span>
                <span className="text-white/40 group-hover:text-white/60 transition-colors leading-relaxed truncate">{s.prompt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasElements = diagram?.data?.elements && diagram.data.elements.length > 0;

  return (
    <div className="fixed bottom-[0.51rem] left-1/2 z-[100] w-[min(680px,calc(100vw-2rem))] -translate-x-1/2">
      <div className="flex flex-col gap-2 rounded-[16px] border border-[#1f1f1f] bg-[#0d0d0d] px-3 pt-3 pb-[0.6rem] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">

        {/* Textarea — grows with content */}
        <textarea
          ref={textareaRef}
          className="w-full resize-none border-none bg-transparent px-1 py-0 text-[0.95rem] leading-[1.6] text-[#e0e0e0] outline-none min-h-[28px] max-h-[240px] overflow-y-auto placeholder-[#444] focus:ring-0"
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

        {/* Bottom row: model selector + Ask Relevant + explanation toggle + send */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="cursor-pointer appearance-none rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] py-[0.3rem] pl-[0.6rem] pr-6 text-[0.78rem] text-[#666] outline-none transition-colors duration-150 hover:border-[#444] hover:text-[#ccc] focus:border-[#444] focus:text-[#ccc] bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%226%22%3E%3Cpath_d=%22M0_0l5_6_5-6z%22_fill=%22%23444%22/%3E%3C/svg%3E')] bg-[right_8px_center] bg-no-repeat"
              value={llm}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value} className="bg-[#0d0d0d] text-[#ccc]">
                  {m.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setAskRelevant(!askRelevant)}
              className={`h-[28px] px-2.5 rounded-lg text-[0.72rem] font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                askRelevant
                  ? "bg-purple-600/20 border-purple-500/50 text-purple-400"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${askRelevant ? "bg-purple-400 animate-pulse" : "bg-white/30"}`} />
              Ask Relevant
            </button>

            {hasElements && (
              <button
                type="button"
                onClick={() => onToggleExplanation?.(!isExplanationOpen)}
                className={`h-[28px] px-2.5 rounded-lg text-[0.72rem] font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isExplanationOpen
                    ? "bg-purple-600/20 border-purple-500/50 text-purple-400"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
                }`}
              >
                Explanation Panel
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {loading ? (
              <button
                type="button"
                className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-colors"
                onClick={handleStop}
                title="Stop generation"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-[#e0e0e0] text-[#111] transition-all duration-150 hover:scale-[1.05] hover:bg-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-[#e0e0e0]"
                onClick={() => handleSubmit()}
                disabled={!prompt.trim()}
                aria-label="Send"
              >
                <SendIcon />
              </button>
            )}
          </div>
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
