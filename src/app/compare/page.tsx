"use client";
import { useState, useEffect } from "react";
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

  // Load state from localStorage on mount to prevent SSR hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedQuery = localStorage.getItem("compare_query");
      if (savedQuery !== null) setQuery(savedQuery);
      
      const savedStrategyA = localStorage.getItem("compare_strategy_a");
      if (savedStrategyA !== null) setStrategyA(savedStrategyA);
      
      const savedStrategyB = localStorage.getItem("compare_strategy_b");
      if (savedStrategyB !== null) setStrategyB(savedStrategyB);
      
      const savedScoreQuality = localStorage.getItem("compare_score_quality");
      if (savedScoreQuality !== null) setScoreQuality(savedScoreQuality === "true");
      
      const savedData = localStorage.getItem("compare_last_result");
      if (savedData !== null) {
        try {
          setData(JSON.parse(savedData));
        } catch (e) {
          console.error("Failed to parse saved compare data:", e);
        }
      }
    }
  }, []);

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const result = await api.compare({ 
        query, 
        strategy_a: strategyA, 
        strategy_b: strategyB, 
        score_quality: scoreQuality, 
        filters: { source: selectedSources.length > 0 ? selectedSources : undefined } 
      });
      setData(result);
      localStorage.setItem("compare_last_result", JSON.stringify(result));
    } catch (e: any) { 
      setError(e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    localStorage.setItem("compare_query", val);
  };

  const handleStrategyAChange = (val: string) => {
    setStrategyA(val);
    localStorage.setItem("compare_strategy_a", val);
  };

  const handleStrategyBChange = (val: string) => {
    setStrategyB(val);
    localStorage.setItem("compare_strategy_b", val);
  };

  const handleScoreQualityChange = (val: boolean) => {
    setScoreQuality(val);
    localStorage.setItem("compare_score_quality", String(val));
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
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); run(); } }}
            rows={2}
            className="input-field resize-none"
            placeholder="Enter comparison prompt... (Ctrl+Enter to execute)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StrategySelector value={strategyA} onChange={handleStrategyAChange} label="Strategy A" />
          <StrategySelector value={strategyB} onChange={handleStrategyBChange} label="Strategy B" />
        </div>

        <label className="flex items-center gap-2.5 text-xs text-zinc-300 border-t border-zinc-800 pt-4 cursor-pointer select-none">
          <input type="checkbox" checked={scoreQuality} onChange={(e) => handleScoreQualityChange(e.target.checked)} className="w-4 h-4 rounded text-gold-600 bg-zinc-900 border-zinc-700 focus:ring-gold-500/50" />
          <span>Evaluate Answer Quality (adds latency)</span>
        </label>

        {error && <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">{error}</div>}

        {loading && (
          <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-800/80 space-y-3">
            <div className="flex items-center gap-3">
              <Spinner size="h-5 w-5 text-gold-400" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-200">
                  {scoreQuality ? "Running strategy comparison & quality evaluation..." : "Comparing retrieval strategies..."}
                </p>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  {scoreQuality 
                    ? "Executing parallel pipelines and running LLM-as-judge checks (Faithfulness + Relevancy)..." 
                    : "Fetching answers and chunk traces from active models..."}
                </p>
              </div>
            </div>
            
            {scoreQuality && (
              <div className="pt-2.5 border-t border-zinc-900/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-semibold">
                <div className="flex items-center gap-2 text-gold-400 bg-gold-400/5 px-2 py-1 rounded border border-gold-400/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
                  <span>1. Context Retrieval</span>
                </div>
                <div className="flex items-center gap-2 text-gold-400 bg-gold-400/5 px-2 py-1 rounded border border-gold-400/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
                  <span>2. Answer Generation</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>3. LLM Evaluation</span>
                </div>
              </div>
            )}
          </div>
        )}

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
