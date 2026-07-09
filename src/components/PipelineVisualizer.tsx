"use client";
import { useState, useCallback } from "react";
import { PipelineStep } from "@/lib/api";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function renderDetailValue(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

function isScoreKey(key: string): boolean {
  return /score/i.test(key);
}

function scoreColorClass(value: any): string {
  if (typeof value !== "number") return "text-zinc-300";
  const v = value >= 0 && value <= 1 ? value : Math.min(1, Math.max(0, (value + 5) / 10));
  if (v >= 0.75) return "text-emerald-400";
  if (v >= 0.5) return "text-amber-400";
  return "text-rose-400";
}

function getStepStatus(detail: Record<string, any>): { dotClass: string; textClass: string; glowClass: string } {
  let total = 0, count = 0;
  for (const [k, v] of Object.entries(detail || {})) {
    if (isScoreKey(k) && typeof v === "number") {
      const s = v >= 0 && v <= 1 ? v : Math.min(1, Math.max(0, (v + 5) / 10));
      total += s; count++;
    }
  }
  if (count === 0) return { dotClass: "bg-zinc-900 border-zinc-800", textClass: "text-gold-400", glowClass: "" };
  const avg = total / count;
  if (avg >= 0.75) return { dotClass: "bg-emerald-500/10 border-emerald-500/30", textClass: "text-emerald-400", glowClass: "shadow-emerald-500/20" };
  if (avg >= 0.5) return { dotClass: "bg-amber-500/10 border-amber-500/30", textClass: "text-amber-400", glowClass: "shadow-amber-500/20" };
  return { dotClass: "bg-rose-500/10 border-rose-500/30", textClass: "text-rose-400", glowClass: "shadow-rose-500/20" };
}

function PromptPreview({ prompt }: { prompt: string }) {
  let systemMsg = "", humanMsg = "", contextSection = "";
  if (prompt.includes("System:") && prompt.includes("Human:")) {
    const parts = prompt.split("Human:");
    humanMsg = parts[1]?.trim() || "";
    const sysPart = parts[0]?.replace("System:", "")?.trim() || "";
    const ctxSplit = sysPart.split("Context:");
    systemMsg = ctxSplit[0]?.trim() || "";
    contextSection = ctxSplit[1]?.trim() || "";
  } else {
    contextSection = prompt;
  }

  return (
    <div className="space-y-4 mt-2">
      {systemMsg && (
        <div className="border border-zinc-800/85 rounded-lg overflow-hidden bg-zinc-950/70 shadow-inner">
          <div className="bg-gold-500/10 px-3 py-1.5 border-b border-zinc-800 text-[10px] font-bold text-gold-400 uppercase tracking-wider">
            System Instructions
          </div>
          <div className="p-3 text-zinc-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">{systemMsg}</div>
        </div>
      )}
      {contextSection && (
        <div className="border border-zinc-800/85 rounded-lg overflow-hidden bg-zinc-950/70 shadow-inner">
          <div className="bg-emerald-500/10 px-3 py-1.5 border-b border-zinc-800 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Assembled Context (Context Window)
          </div>
          <div className="p-3 text-zinc-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">{contextSection}</div>
        </div>
      )}
      {humanMsg && (
        <div className="border border-zinc-800/85 rounded-lg overflow-hidden bg-zinc-950/70 shadow-inner">
          <div className="bg-amber-500/10 px-3 py-1.5 border-b border-zinc-800 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            User Query Statement
          </div>
          <div className="p-3 text-zinc-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">{humanMsg}</div>
        </div>
      )}
    </div>
  );
}

function FlowchartView({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="flex flex-col items-center gap-1 py-4">
      {steps.map((step, i) => {
        const status = getStepStatus(step.detail);
        return (
          <div key={i} className="flex flex-col items-center w-full max-w-xs animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`w-full px-4 py-2.5 rounded-lg border text-center text-xs font-medium transition-all duration-300 ${status.dotClass} ${status.textClass} hover:scale-[1.02]`}>
              <div className="font-semibold capitalize">{step.name.replaceAll("_", " ")}</div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{step.duration_ms.toFixed(1)} ms</div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center my-0.5">
                <div className="w-[1px] h-3 bg-zinc-700" />
                <svg className="w-3 h-3 text-zinc-600 -mt-0.5" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M6 10L1 5h10L6 10z" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepCard({ step, index, isOpen, onToggle, animDelay }: { step: PipelineStep; index: number; isOpen: boolean; onToggle: () => void; animDelay: number }) {
  const status = getStepStatus(step.detail);

  return (
    <div className="relative pl-12 animate-slide-up" style={{ animationDelay: `${animDelay}ms` }}>
      <div className={`absolute left-3 top-2 w-6 h-6 rounded-full flex items-center justify-center border shadow-md transition-all duration-300 ${status.dotClass} ${status.glowClass ? `shadow-lg ${status.glowClass}` : ""}`}>
        <span className={`text-[10px] font-mono font-bold ${status.textClass}`}>{index + 1}</span>
      </div>

      <div className="card hover:border-zinc-700 overflow-hidden transition-all duration-200">
        <button onClick={onToggle} className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-zinc-200 tracking-tight capitalize">
            {step.name.replaceAll("_", " ")}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/70">
              {step.duration_ms.toFixed(1)} ms
            </span>
            <svg className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="px-5 pb-5 border-t border-zinc-800/70 bg-zinc-950/40 pt-4 text-xs space-y-3">
            {Object.entries(step.detail || {}).map(([k, v]) => {
              const isScore = isScoreKey(k);
              const valueStr = renderDetailValue(v);

              if (k === "prompt_preview" || k === "prompt") {
                return (
                  <div key={k} className="space-y-1">
                    <div className="label">Assembled Context Window ({k})</div>
                    <PromptPreview prompt={String(v)} />
                  </div>
                );
              }

              return (
                <div key={k} className="space-y-1">
                  <div className="label">{k}</div>
                  {typeof v === "object" && v !== null ? (
                    <div className="rounded-lg overflow-hidden border border-zinc-800/70 shadow-inner">
                      <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{ margin: 0, padding: "12px", fontSize: "11px", background: "#09090b" }}>
                        {valueStr}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <div className={`font-mono text-xs ${isScore ? scoreColorClass(v) + " font-semibold text-sm" : "text-zinc-300"}`}>
                      {valueStr}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelineVisualizer({ steps }: { steps: PipelineStep[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "flowchart">("timeline");
  const [copied, setCopied] = useState(false);

  const copyTrace = useCallback(() => {
    const traceText = steps.map((s, i) =>
      `[Step ${i + 1}] ${s.name} (${s.duration_ms.toFixed(1)}ms)\n${Object.entries(s.detail || {}).map(([k, v]) => `  ${k}: ${renderDetailValue(v)}`).join("\n")}`
    ).join("\n\n");
    navigator.clipboard.writeText(traceText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [steps]);

  if (!steps?.length) {
    return (
      <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur-md p-6 text-zinc-500 text-sm text-center">
        No pipeline trace yet. Submit a query to see trace information.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "timeline" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode("flowchart")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "flowchart" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Flowchart
          </button>
        </div>
        <button
          onClick={copyTrace}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-all font-medium flex items-center gap-1.5"
        >
          {copied ? (
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          )}
          {copied ? "Copied!" : "Copy Trace"}
        </button>
      </div>

      {viewMode === "flowchart" ? (
        <div className="card p-4">
          <FlowchartView steps={steps} />
        </div>
      ) : (
        <div className="relative pl-2">
          <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-zinc-800" />
          <div className="space-y-4">
            {steps.map((s, i) => (
              <StepCard
                key={i}
                step={s}
                index={i}
                isOpen={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                animDelay={i * 60}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
