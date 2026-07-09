"use client";
import { useState, useEffect } from "react";
import QueryPanel from "@/components/QueryPanel";
import AnswerDisplay from "@/components/AnswerDisplay";
import ChunkInspector from "@/components/ChunkInspector";
import PipelineVisualizer from "@/components/PipelineVisualizer";
import RetrievalDebugger from "@/components/RetrievalDebugger";
import Spinner from "@/components/ui/Spinner";
import { QueryResponse, api } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function DashboardPage() {
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const history = useAppStore((s) => s.history);
  const setHistory = useAppStore((s) => s.setHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [prefill, setPrefill] = useState<any>(null);

  useEffect(() => {
    api.queryHistory(20)
      .then((data) => {
        const mapped = data.map((h: any) => ({
          ...h, query_id: h.id || h.query_id,
          pipeline: h.trace || h.pipeline || [],
          chunks: h.chunks || [],
        }));
        setHistory(mapped);
      })
      .catch(() => {});
  }, [setHistory]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Query Workspace</h1>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">
            Submit search prompts, adjust semantic vs. BM25 weight ratios, configure metadata filters, and analyze multi-step retrieval executions.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 hover:text-zinc-200 hover:border-zinc-700 active:scale-[0.98] transition-all self-start sm:self-center shrink-0"
          >
            <svg className={`h-3.5 w-3.5 text-zinc-500 transform transition-transform ${showHistory ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
            Query History ({history.length})
          </button>
        )}
      </div>

      {showHistory && history.length > 0 && (
        <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur-md p-4 space-y-2 shadow-xl shadow-black/20 animate-in">
          <div className="label mb-1">Recent Searches</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {history.map((h) => (
              <button
                key={h.query_id || h.id}
                onClick={() => {
                  setResult({
                    query_id: h.query_id || h.id, query: h.query, strategy: h.strategy,
                    answer: h.answer, chunks: h.chunks || [], pipeline: h.pipeline || h.trace || [],
                    input_tokens: h.input_tokens || 0, output_tokens: h.output_tokens || 0, latency_ms: h.latency_ms || 0,
                  });
                  setPrefill({ query: h.query, strategy: h.strategy, filters: h.filters || {} });
                  setShowHistory(false);
                }}
                className="w-full text-left text-xs bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-800/70 hover:border-zinc-700 rounded-lg p-3 flex items-center justify-between gap-4 transition-all"
              >
                <span className="truncate text-zinc-300 font-medium flex-1">{h.query}</span>
                <span className="badge-gold">{h.strategy.replace(/_/g, " ")}</span>
                <span className="text-zinc-500 font-mono text-[10px] shrink-0">{h.latency_ms.toFixed(0)}ms</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <QueryPanel onResult={setResult} onLoading={setLoading} prefill={prefill} onPrefillClear={() => setPrefill(null)} />
          <div className="space-y-2.5">
            <h2 className="label">Generated Synthesis</h2>
            <AnswerDisplay result={result} />
          </div>
          <div className="space-y-4">
            <h2 className="label">Pipeline Execution Graph</h2>
            {loading ? (
              <div className="card p-8 flex flex-col items-center justify-center text-zinc-500 text-sm">
                <Spinner size="h-5 w-5" />
                <span className="mt-2">Tracing execution blocks...</span>
              </div>
            ) : (
              <PipelineVisualizer steps={result?.pipeline || []} />
            )}
          </div>
          {result && result.chunks.length > 0 && !loading && (
            <RetrievalDebugger result={result} />
          )}
        </div>

        <div className="space-y-3">
          <h2 className="label">Retrieved Text Chunks {result ? `(${result.chunks.length})` : ""}</h2>
          {loading ? (
            <div className="card p-8 flex flex-col items-center justify-center text-zinc-500 text-sm">
              <Spinner size="h-5 w-5" />
              <span className="mt-2">Querying vector store...</span>
            </div>
          ) : (
            <ChunkInspector chunks={result?.chunks || []} />
          )}
        </div>
      </div>
    </div>
  );
}
