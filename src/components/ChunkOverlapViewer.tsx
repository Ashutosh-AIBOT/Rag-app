"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

type ChunkSpan = {
  chunk_id: string;
  text_preview: string;
  text_length: number;
  page?: number | null;
  section?: string;
  source?: string;
};

type OverlapData = {
  doc_id: string;
  filename: string;
  total_chars_by_strategy: Record<string, number>;
  strategies: Record<string, ChunkSpan[]>;
};

const STRATEGY_COLORS: Record<string, string> = {
  recursive: "bg-indigo-500",
  semantic: "bg-emerald-500",
  parent_child: "bg-amber-500",
  section: "bg-rose-500",
  multi_vector: "bg-violet-500",
};

const STRATEGY_BORDER: Record<string, string> = {
  recursive: "border-indigo-500/50",
  semantic: "border-emerald-500/50",
  parent_child: "border-amber-500/50",
  section: "border-rose-500/50",
  multi_vector: "border-violet-500/50",
};

const STRATEGY_TEXT: Record<string, string> = {
  recursive: "text-indigo-400",
  semantic: "text-emerald-400",
  parent_child: "text-amber-400",
  section: "text-rose-400",
  multi_vector: "text-violet-400",
};

export default function ChunkOverlapViewer({ docId, filename }: { docId: string; filename: string }) {
  const [data, setData] = useState<OverlapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredChunk, setHoveredChunk] = useState<ChunkSpan | null>(null);
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getChunkOverlap(docId);
      setData(result);
    } catch (e: any) {
      setError(e.message || "Failed to load overlap data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [docId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-zinc-500 text-xs">
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Building overlap map...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const strategies = Object.keys(data.strategies).filter(
    (s) => data.strategies[s].length > 0
  );
  const maxTotal = Math.max(...Object.values(data.total_chars_by_strategy));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Chunk Overlap Visualizer
        </h3>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Each row shows how a chunking strategy divides the document. Bar widths are proportional
          to chunk character length. Hover a segment to inspect the chunk preview.
        </p>
      </div>

      {/* Strategy Legend */}
      <div className="flex flex-wrap gap-3">
        {strategies.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStrategy(activeStrategy === s ? null : s)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
              activeStrategy === null || activeStrategy === s
                ? `${STRATEGY_BORDER[s] ?? "border-zinc-700"} ${STRATEGY_TEXT[s] ?? "text-zinc-400"} bg-zinc-900`
                : "border-zinc-800 text-zinc-600 bg-zinc-950 opacity-50"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${STRATEGY_COLORS[s] ?? "bg-zinc-500"}`} />
            {s.replace(/_/g, " ").toUpperCase()}
            <span className="text-zinc-500 font-mono">
              {data.strategies[s].length}
            </span>
          </button>
        ))}
      </div>

      {/* Strategy Rows */}
      <div className="space-y-4">
        {strategies.map((strategy) => {
          if (activeStrategy && activeStrategy !== strategy) return null;
          const chunks = data.strategies[strategy];
          const totalChars = data.total_chars_by_strategy[strategy] || 1;
          const color = STRATEGY_COLORS[strategy] ?? "bg-zinc-500";
          const textColor = STRATEGY_TEXT[strategy] ?? "text-zinc-400";

          return (
            <div key={strategy} className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className={`font-bold uppercase tracking-wider ${textColor}`}>
                  {strategy.replace(/_/g, " ")}
                </span>
                <div className="flex items-center gap-3 text-zinc-500 font-mono">
                  <span>{chunks.length} chunks</span>
                  <span>{(totalChars / 1000).toFixed(1)}k chars</span>
                  {/* Coverage bar vs largest strategy */}
                  <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full`}
                      style={{ width: `${(totalChars / maxTotal) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Chunk segments */}
              <div className="flex h-9 w-full rounded-lg overflow-hidden border border-zinc-800/80 bg-zinc-950 gap-px">
                {chunks.map((chunk, idx) => {
                  const widthPct = (chunk.text_length / totalChars) * 100;
                  const isHovered = hoveredChunk?.chunk_id === chunk.chunk_id;
                  return (
                    <div
                      key={chunk.chunk_id || idx}
                      className={`relative h-full cursor-pointer transition-all duration-150 ${
                        color.replace("bg-", "bg-").replace("500", isHovered ? "400" : "500")
                      } ${isHovered ? "opacity-100 z-10 ring-1 ring-white/20" : "opacity-70 hover:opacity-90"}`}
                      style={{ width: `${Math.max(widthPct, 0.5)}%` }}
                      onMouseEnter={() => setHoveredChunk(chunk)}
                      onMouseLeave={() => setHoveredChunk(null)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover Tooltip Panel */}
      {hoveredChunk && (
        <div className="border border-zinc-700/80 rounded-xl bg-zinc-900 p-4 space-y-3 shadow-xl shadow-black/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Chunk Preview
            </div>
            <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
              {hoveredChunk.page != null && <span>Page {hoveredChunk.page}</span>}
              {hoveredChunk.section && <span className="max-w-[140px] truncate">{hoveredChunk.section}</span>}
              <span>{hoveredChunk.text_length.toLocaleString()} chars</span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2.5 shadow-inner">
            {hoveredChunk.text_preview}
            {hoveredChunk.text_length > 120 && (
              <span className="text-zinc-600"> …[{hoveredChunk.text_length - 120} more chars]</span>
            )}
          </p>
        </div>
      )}

      {/* Summary stats table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-zinc-950/40 text-zinc-500 border-b border-zinc-800 font-semibold">
              <th className="px-4 py-2.5">Strategy</th>
              <th className="px-4 py-2.5 text-right">Chunks</th>
              <th className="px-4 py-2.5 text-right">Total Chars</th>
              <th className="px-4 py-2.5 text-right">Avg Chunk Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {strategies.map((s) => {
              const chunks = data.strategies[s];
              const total = data.total_chars_by_strategy[s] || 0;
              const avg = chunks.length > 0 ? Math.round(total / chunks.length) : 0;
              const textColor = STRATEGY_TEXT[s] ?? "text-zinc-400";
              return (
                <tr key={s} className="hover:bg-zinc-950/20 transition-colors">
                  <td className={`px-4 py-2.5 font-semibold uppercase text-[10px] tracking-wider ${textColor}`}>
                    {s.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{chunks.length}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-300">
                    {total.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-300">
                    {avg.toLocaleString()} chars
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
