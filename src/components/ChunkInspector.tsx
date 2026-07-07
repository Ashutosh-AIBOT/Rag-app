"use client";
import { useEffect, useRef, useState } from "react";
import { ChunkScore } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import Badge from "./ui/Badge";

function scoreBadgeVariant(score?: number): "green" | "amber" | "rose" {
  if (score === undefined || score === null) return "amber";
  if (score >= 0.66) return "green";
  if (score >= 0.33) return "amber";
  return "rose";
}

function scoreTextColor(score?: number): string {
  if (score === undefined || score === null) return "text-amber-400";
  if (score >= 0.66) return "text-emerald-400";
  if (score >= 0.33) return "text-amber-400";
  return "text-rose-400";
}

function fmt(n?: number) {
  if (n === undefined || n === null) return "—";
  return n.toFixed(3);
}

function ScoreGrid({ c }: { c: ChunkScore }) {
  const scores = [
    { label: "Semantic", value: c.semantic_score },
    { label: "BM25", value: c.bm25_score },
    { label: "RRF", value: c.rrf_score },
    { label: "Rerank", value: c.rerank_score, extra: true },
    { label: "Initial Rank", value: c.original_rank, raw: true },
    { label: "Final Rank", value: c.final_rank, raw: true },
    { label: "Tokens", value: c.token_count, raw: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
      {scores.map(({ label, value, raw }) => (
        <div key={label} className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-lg">
          <div className="label">{label}</div>
          <div className={`font-mono text-sm font-semibold mt-0.5 ${
            raw ? "text-zinc-300" : scoreTextColor(value as number)
          }`}>
            {raw ? (value ?? "—") : fmt(value as number)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ViewToggle({ mode, onChange }: { mode: "child" | "parent"; onChange: (m: "child" | "parent") => void }) {
  return (
    <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
      {(["child", "parent"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider transition-all ${
            mode === m ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {m === "child" ? "Match (Child)" : "Context (Parent)"}
        </button>
      ))}
    </div>
  );
}

export default function ChunkInspector({
  chunks,
  overlapIds = [],
}: {
  chunks: ChunkScore[];
  overlapIds?: string[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<Record<string, "child" | "parent">>({});
  const highlightSource = useAppStore((s) => s.highlightSource);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!highlightSource) return;
    const match = chunks.find((c) => c.source === highlightSource);
    if (match) {
      const key = match.chunk_id + chunks.indexOf(match);
      setExpanded(key);
      refs.current[key]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightSource, chunks]);

  if (!chunks?.length) {
    return (
      <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur-md p-6 text-zinc-500 text-sm text-center">
        No chunks retrieved yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chunks.map((c, idx) => {
        const key = c.chunk_id + idx;
        const isOpen = expanded === key;
        const isHighlighted = highlightSource === c.source;
        const isOverlap = overlapIds.includes(c.chunk_id);
        const finalRank = c.final_rank ?? c.original_rank ?? idx + 1;

        return (
          <div
            key={key}
            ref={(el) => { refs.current[key] = el; }}
            className={`border rounded-xl bg-zinc-900 overflow-hidden transition-all duration-200 ${
              isHighlighted ? "border-indigo-500 ring-2 ring-indigo-500/20"
              : isOverlap ? "border-amber-500/40 bg-amber-500/[0.02]"
              : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : key)}
              className="w-full text-left px-5 py-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                    #{finalRank}
                  </span>
                  <span className="text-xs font-medium text-zinc-400 truncate max-w-[200px]" title={c.source}>
                    {c.source} {c.page ? `· Page ${c.page}` : ""}
                  </span>
                  {c.section && (
                    <Badge variant="default">{c.section}</Badge>
                  )}
                  <Badge variant="indigo">{c.strategy}</Badge>
                  {c.token_count != null && <Badge variant="default">{c.token_count} tok</Badge>}
                  {isOverlap && <Badge variant="amber">Shared</Badge>}
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{c.text}</p>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0 self-center">
                {c.rerank_score != null && (
                  <Badge variant={scoreBadgeVariant((c.rerank_score + 5) / 10)}>
                    Rerank {fmt(c.rerank_score)}
                  </Badge>
                )}
                {c.rrf_score != null && (
                  <Badge variant={scoreBadgeVariant(c.rrf_score * 20)}>
                    RRF {fmt(c.rrf_score)}
                  </Badge>
                )}
                <svg className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-zinc-800/80 bg-zinc-950/40 pt-4 space-y-4 text-xs">
                <ScoreGrid c={c} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="label">{c.child_text ? "Context Expansion" : "Full Chunk Text"}</div>
                    {c.child_text && <ViewToggle mode={viewMode[key] || "parent"} onChange={(m) => setViewMode((prev) => ({ ...prev, [key]: m }))} />}
                  </div>
                  <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {c.child_text && viewMode[key] === "child" ? c.child_text : c.text}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
