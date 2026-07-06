"use client";
import { useState } from "react";
import StrategySelector from "@/components/StrategySelector";
import ComparisonView from "@/components/ComparisonView";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function ComparePage() {
  const [query, setQuery] = useState("Compare the pricing of the Starter plan and Enterprise plan.");
  const [strategyA, setStrategyA] = useState("basic_vector");
  const [strategyB, setStrategyB] = useState("hybrid_rerank");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof api.compare>> | null>(null);
  const [scoreQuality, setScoreQuality] = useState(true);
  const selectedSources = useAppStore((s) => s.selectedSources);

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const result = await api.compare({ query, strategy_a: strategyA, strategy_b: strategyB, score_quality: scoreQuality, filters: { source: selectedSources.length > 0 ? selectedSources : undefined } });
      setData(result);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">A/B Strategy Comparison</h1>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">
          Run identical query statements through distinct retrieval engines side-by-side.
        </p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label className="label">Query Statement</label>
            {selectedSources.length > 0 ? (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Querying {selectedSources.length} selected document(s)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>Searching entire index</span>
              </div>
            )}
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); run(); } }}
            rows={2}
            className="input-field resize-none"
            placeholder="Enter comparison prompt... (Ctrl+Enter to execute)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StrategySelector value={strategyA} onChange={setStrategyA} label="Strategy A" />
          <StrategySelector value={strategyB} onChange={setStrategyB} label="Strategy B" />
        </div>

        <label className="flex items-center gap-2.5 text-xs text-zinc-300 border-t border-zinc-800 pt-4 cursor-pointer select-none">
          <input type="checkbox" checked={scoreQuality} onChange={(e) => setScoreQuality(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 bg-zinc-900 border-zinc-700 focus:ring-indigo-500/50" />
          <span>Evaluate Answer Quality (adds latency)</span>
        </label>

        {error && <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">{error}</div>}

        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <button onClick={run} disabled={loading} className="btn-primary w-full sm:w-auto">
            {loading ? <span className="flex items-center justify-center gap-2"><Spinner size="h-4 w-4" /> Comparing...</span> : "Compare Runs"}
          </button>
        </div>
      </div>

      {data && (
        <div className="space-y-6">
          <h2 className="label">Analysis Output</h2>
          <ComparisonView resultA={data.result_a} resultB={data.result_b} overlapIds={data.overlap_chunk_ids} />
        </div>
      )}
    </div>
  );
}
