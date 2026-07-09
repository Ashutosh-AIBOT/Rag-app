"use client";
import { useState, useEffect } from "react";
import StrategySelector from "./StrategySelector";
import MetadataFilters from "./MetadataFilters";
import Toggle from "./ui/Toggle";
import Spinner from "./ui/Spinner";
import { api, streamQuery, MetadataFilters as Filters, QueryResponse, ChunkScore } from "@/lib/api";
import { useAppStore } from "@/lib/store";

function WeightSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="label">Semantic vs. BM25 Ratio</label>
      <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-gold-500 cursor-pointer"
        />
        <span className="text-xs font-mono font-medium text-zinc-300 w-24 text-right shrink-0">
          {Math.round(value * 100)}% Semantic
        </span>
      </div>
    </div>
  );
}

function StreamingOutput({ answer, loading }: { answer: string; loading: boolean }) {
  if (!answer) return null;
  return (
    <div className="space-y-2">
      <div className="label">Streaming Output</div>
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed shadow-inner max-h-60 overflow-y-auto">
        {answer}
        {loading && <span className="inline-block w-1.5 h-4 bg-gold-500 animate-pulse ml-0.5 align-middle" />}
      </div>
    </div>
  );
}

function FilterBadge({ selectedSources }: { selectedSources: string[] }) {
  if (selectedSources.length > 0) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg select-none self-start sm:self-center">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Querying {selectedSources.length} selected document(s)</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg select-none self-start sm:self-center">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      <span>Searching entire index (no filter)</span>
    </div>
  );
}

export default function QueryPanel({
  onResult,
  onLoading,
  prefill,
  onPrefillClear,
}: {
  onResult: (r: QueryResponse) => void;
  onLoading: (b: boolean) => void;
  prefill?: { query: string; strategy: string; filters?: Filters } | null;
  onPrefillClear?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [strategy, setStrategy] = useState("hybrid_rerank");
  const [filters, setFilters] = useState<Filters>({});
  const [semanticWeight, setSemanticWeight] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState(false);
  const [compressContext, setCompressContext] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const pushHistory = useAppStore((s) => s.pushHistory);
  const selectedSources = useAppStore((s) => s.selectedSources);

  useEffect(() => {
    if (prefill) {
      setQuery(prefill.query);
      setStrategy(prefill.strategy);
      setFilters(prefill.filters || {});
      onPrefillClear?.();
    }
  }, [prefill, onPrefillClear]);

  const runQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    onLoading(true);
    setError(null);
    setStreamingAnswer("");

    const basePayload = {
      query,
      strategy,
      filters: {
        ...filters,
        source: filters.source || (selectedSources.length > 0 ? selectedSources : undefined),
      },
      semantic_weight: semanticWeight,
      bm25_weight: 1 - semanticWeight,
      compress_context: compressContext,
    };

    try {
      if (stream) {
        const start = performance.now();
        let chunksSoFar: ChunkScore[] = [];
        let answerSoFar = "";
        let queryId = "";
        let inputTokens = 0;
        let outputTokens = 0;

        // Typewriter queue variables
        let tokenQueue: string[] = [];
        let displayAnswer = "";
        let isDone = false;
        let isProcessing = true;

        const processQueue = () => {
          if (!isProcessing) return;
          if (tokenQueue.length > 0) {
            const nextToken = tokenQueue.shift();
            if (nextToken) {
              displayAnswer += nextToken;
              setStreamingAnswer(displayAnswer);
            }
            // If queue is building up, consume tokens faster (5ms), otherwise slow down (25ms)
            const speed = tokenQueue.length > 8 ? 5 : 25;
            setTimeout(processQueue, speed);
          } else {
            if (isDone) {
              setStreamingAnswer(answerSoFar);
              isProcessing = false;
            } else {
              // Wait and check again
              setTimeout(processQueue, 30);
            }
          }
        };

        // Start processing queue
        setTimeout(processQueue, 25);

        try {
          await streamQuery(basePayload, {
            onChunks: (chunks) => {
              chunksSoFar = chunks as unknown as ChunkScore[];
              onResult({
                query_id: "stream",
                query,
                strategy,
                answer: "",
                chunks: chunksSoFar,
                pipeline: [],
                input_tokens: 0,
                output_tokens: 0,
                latency_ms: 0,
              });
            },
            onToken: (token) => {
              answerSoFar += token;
              tokenQueue.push(token);
            },
            onDone: async (info) => {
              queryId = info.query_id;
              inputTokens = info.input_tokens || 0;
              outputTokens = info.output_tokens || 0;
              isDone = true;
            },
            onError: (err) => {
              setError(err.message);
              isDone = true;
            },
          });
        } catch (streamErr) {
          isDone = true;
          isProcessing = false;
          throw streamErr;
        }

        // Wait until queue is fully drained before completing runQuery
        while (isProcessing) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        let pipeline: QueryResponse["pipeline"] = [];
        if (queryId) {
          try { const p = await api.getQueryPipeline(queryId); pipeline = p.pipeline; } catch (e) {
            console.warn("[QueryPanel] Failed to fetch pipeline trace:", e);
          }
        }

        const latencyMs = Math.round(performance.now() - start);
        const result: QueryResponse = {
          query_id: queryId || "stream", query, strategy, answer: answerSoFar,
          chunks: chunksSoFar, pipeline, input_tokens: inputTokens,
          output_tokens: outputTokens || Math.round(answerSoFar.split(/\s+/).length * 1.3),
          latency_ms: latencyMs,
        };
        onResult(result);
        pushHistory({ ...result, filters: basePayload.filters });
      } else {
        const result = await api.query(basePayload);
        onResult(result);
        pushHistory({ ...result, filters: basePayload.filters });
      }
    } catch (e: any) {
      setError(e.message || "Query failed");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="label">Ask a Question</label>
          <FilterBadge selectedSources={selectedSources} />
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); runQuery(); } }}
          rows={3}
          className="input-field resize-none"
          placeholder="Ask anything about your loaded documents... (Ctrl+Enter to execute)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StrategySelector value={strategy} onChange={setStrategy} />
        <WeightSlider value={semanticWeight} onChange={setSemanticWeight} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
        <Toggle checked={stream} onChange={setStream} label="Stream response (SSE)" description="Render response tokens in real-time" />
        <Toggle checked={compressContext} onChange={setCompressContext} label="Contextual Compression" description="Extract only relevant context sentences" />
      </div>

      <MetadataFilters filters={filters} onChange={setFilters} />

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      <StreamingOutput answer={streamingAnswer} loading={loading} />

      <div className="flex justify-end pt-2 border-t border-zinc-800">
        <button onClick={runQuery} disabled={loading} className="btn-primary w-full sm:w-auto">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="h-4 w-4" /> Running pipeline...
            </span>
          ) : "Execute Query"}
        </button>
      </div>
    </div>
  );
}
