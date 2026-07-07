"use client";
import { useState } from "react";
import { QueryResponse, ChunkScore } from "@/lib/api";

const CONTEXT_WINDOW = 8192;

function StatusIcon({ status }: { status: "good" | "warn" | "bad" }) {
  if (status === "good") return <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />;
  if (status === "warn") return <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />;
  return <span className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />;
}

function Section({ title, status, children }: { title: string; status: "good" | "warn" | "bad"; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <StatusIcon status={status} />
        <span className="text-xs font-semibold text-zinc-200">{title}</span>
      </div>
      <div className="pl-4 text-xs text-zinc-400 leading-relaxed">{children}</div>
    </div>
  );
}

function checkRetrievalQuality(chunks: ChunkScore[]) {
  if (chunks.length === 0) return { status: "bad" as const, detail: "No chunks retrieved." };
  const high = chunks.filter((c) => (c.semantic_score ?? 0) > 0.5).length;
  const moderate = chunks.filter((c) => (c.semantic_score ?? 0) >= 0.3 && (c.semantic_score ?? 0) <= 0.5).length;
  const low = chunks.filter((c) => (c.semantic_score ?? 0) < 0.3).length;
  const total = chunks.length;
  const highPct = Math.round((high / total) * 100);

  if (highPct >= 60) return { status: "good" as const, detail: `${high} of ${total} chunks have good relevance (>0.5). Retrieval quality is strong.` };
  if (highPct >= 30) return { status: "warn" as const, detail: `${high} good, ${moderate} moderate, ${low} low relevance chunks. Consider refining the query or adjusting semantic/BM25 weights.` };
  return { status: "bad" as const, detail: `Only ${high} of ${total} chunks have good relevance. Retrieved chunks may not match the query well.` };
}

function checkRankingQuality(chunks: ChunkScore[]) {
  const reranked = chunks.filter((c) => c.original_rank != null && c.final_rank != null);
  if (reranked.length === 0) return { status: "good" as const, detail: "No re-ranking applied or ranks not available." };
  const improved = reranked.filter((c) => c.final_rank! < c.original_rank!).length;
  const degraded = reranked.filter((c) => c.final_rank! > c.original_rank!).length;
  const unchanged = reranked.length - improved - degraded;

  if (improved > degraded) return { status: "good" as const, detail: `Re-ranking improved ${improved} chunk(s), degraded ${degraded}, unchanged ${unchanged}. Overall ordering improved.` };
  if (improved === degraded) return { status: "warn" as const, detail: `Re-ranking improved ${improved} but degraded ${degraded} chunk(s). Net effect is neutral.` };
  return { status: "warn" as const, detail: `Re-ranking degraded ${degraded} chunk(s) but improved ${improved}. Check if reranker is well-calibrated for this query type.` };
}

function checkContextWindow(inputTokens: number) {
  const utilization = (inputTokens / CONTEXT_WINDOW) * 100;
  if (utilization < 20) return { status: "warn" as const, pct: utilization, detail: `Context window is only ${utilization.toFixed(0)}% full (${inputTokens}/${CONTEXT_WINDOW} tokens). Consider increasing top_k to provide more context.` };
  if (utilization > 90) return { status: "warn" as const, pct: utilization, detail: `Context window is ${utilization.toFixed(0)}% full (${inputTokens}/${CONTEXT_WINDOW} tokens). Some context may be truncated. Consider reducing top_k or enabling compression.` };
  return { status: "good" as const, pct: utilization, detail: `Context window utilization: ${utilization.toFixed(0)}% (${inputTokens}/${CONTEXT_WINDOW} tokens). Healthy range.` };
}

function checkSourceDiversity(chunks: ChunkScore[]) {
  const sources = [...new Set(chunks.map((c) => c.source))];
  if (sources.length === 0) return { status: "bad" as const, detail: "No sources in retrieved chunks." };
  if (sources.length === 1) return { status: "warn" as const, detail: `All chunks come from a single source: ${sources[0]}. Consider adding more diverse documents for broader coverage.` };
  return { status: "good" as const, detail: `Context drawn from ${sources.length} unique source document(s): ${sources.join(", ")}. Good diversity.` };
}

export default function RetrievalDebugger({ result }: { result: QueryResponse }) {
  const [open, setOpen] = useState(false);
  const chunks = result.chunks || [];

  const retrieval = checkRetrievalQuality(chunks);
  const ranking = checkRankingQuality(chunks);
  const contextWin = checkContextWindow(result.input_tokens);
  const diversity = checkSourceDiversity(chunks);

  const overallStatus: "good" | "warn" | "bad" =
    [retrieval.status, ranking.status, contextWin.status, diversity.status].includes("bad") ? "bad"
    : [retrieval.status, ranking.status, contextWin.status, diversity.status].includes("warn") ? "warn"
    : "good";

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <StatusIcon status={overallStatus} />
          <span className="text-sm font-semibold text-zinc-200">Retrieval Debugger</span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {chunks.length} chunks · {result.input_tokens} tokens
          </span>
        </div>
        <svg className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-4">
          <Section title="Retrieval Quality" status={retrieval.status}>
            {retrieval.detail}
          </Section>
          <Section title="Ranking Quality" status={ranking.status}>
            {ranking.detail}
          </Section>
          <Section title="Context Window Utilization" status={contextWin.status}>
            <div className="space-y-1.5">
              <p>{contextWin.detail}</p>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden max-w-xs">
                <div
                  className={`h-full rounded-full ${contextWin.pct! > 90 ? "bg-rose-500" : contextWin.pct! < 20 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, contextWin.pct || 0)}%` }}
                />
              </div>
            </div>
          </Section>
          <Section title="Source Diversity" status={diversity.status}>
            {diversity.detail}
          </Section>
        </div>
      )}
    </div>
  );
}
