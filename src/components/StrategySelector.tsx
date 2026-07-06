"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const DEFAULT_STRATEGIES = [
  { id: "basic_vector", description: "Standard cosine-similarity vector search (baseline)." },
  { id: "hybrid", description: "Semantic + BM25 combined via Reciprocal Rank Fusion." },
  { id: "hybrid_rerank", description: "Hybrid retrieval, top-20, then cross-encoder rerank to top-5." },
  { id: "parent_child", description: "Search small child chunks, return larger parent chunks." },
  { id: "multi_query", description: "LLM generates query variants, merges results." },
  { id: "hyde", description: "Embeds a hypothetical LLM-generated answer instead of the query." },
  { id: "decomposition", description: "Breaks complex questions into sub-questions." },
  { id: "step_back", description: "Generates a broader step-back question alongside the specific one." },
  { id: "auto", description: "Picks the best strategy automatically based on the query." },
  { id: "multi_vector", description: "[Bonus] Indexes summaries + hypothetical questions per chunk." },
  { id: "section_search", description: "Search over section-based chunks (one chunk per H1/H2 section)." },
];

export default function StrategySelector({
  value,
  onChange,
  label = "Retrieval Strategy",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [strategies, setStrategies] = useState(DEFAULT_STRATEGIES);

  useEffect(() => {
    api.listStrategies().then(setStrategies).catch(() => {});
  }, []);

  const current = strategies.find((s) => s.id === value);

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field appearance-none cursor-pointer"
        >
          {strategies.map((s) => (
            <option key={s.id} value={s.id} className="bg-zinc-950 text-zinc-100">
              {s.id.replace(/_/g, " ").toUpperCase()}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
        </div>
      </div>
      {current && (
        <p className="text-xs text-zinc-500 italic mt-1 leading-relaxed">{current.description}</p>
      )}
    </div>
  );
}
