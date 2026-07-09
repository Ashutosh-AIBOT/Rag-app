"use client";
import { QueryResponse } from "@/lib/api";
import AnswerDisplay from "./AnswerDisplay";
import ChunkInspector from "./ChunkInspector";
import PipelineVisualizer from "./PipelineVisualizer";
import ReactDiffViewer from "react-diff-viewer";

function MetricsTable({ resultA, resultB, overlapIds }: { resultA: QueryResponse; resultB: QueryResponse; overlapIds: string[] }) {
  const metrics = [
    { label: "Latency", a: `${resultA.latency_ms.toFixed(0)} ms`, b: `${resultB.latency_ms.toFixed(0)} ms` },
    { label: "Input Tokens", a: resultA.input_tokens, b: resultB.input_tokens },
    { label: "Output Tokens", a: resultA.output_tokens, b: resultB.output_tokens },
    { label: "Chunks Retrieved", a: resultA.chunks.length, b: resultB.chunks.length },
    { label: "Est. Cost (USD)", a: `$${(resultA.estimated_cost_usd ?? 0).toFixed(6)}`, b: `$${(resultB.estimated_cost_usd ?? 0).toFixed(6)}` },
    { label: "Faithfulness", a: resultA.faithfulness?.toFixed(2) ?? "—", b: resultB.faithfulness?.toFixed(2) ?? "—" },
    { label: "Answer Relevancy", a: resultA.answer_relevancy?.toFixed(2) ?? "—", b: resultB.answer_relevancy?.toFixed(2) ?? "—" },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/40">
        <h3 className="label">Quantitative Benchmarks</h3>
      </div>
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="bg-zinc-950/20 text-zinc-400 border-b border-zinc-800 font-semibold">
            <th className="px-5 py-3">Metric</th>
            <th className="px-5 py-3 uppercase tracking-wider text-gold-400 font-mono text-[10px]">
              A: {resultA.strategy.replace(/_/g, " ")}
            </th>
            <th className="px-5 py-3 uppercase tracking-wider text-emerald-400 font-mono text-[10px]">
              B: {resultB.strategy.replace(/_/g, " ")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {metrics.map((m) => (
            <tr key={m.label} className="hover:bg-zinc-950/10 transition-colors">
              <td className="px-5 py-3 text-zinc-300 font-medium">{m.label}</td>
              <td className="px-5 py-3 font-mono text-zinc-200">{m.a}</td>
              <td className="px-5 py-3 font-mono text-zinc-200">{m.b}</td>
            </tr>
          ))}
          <tr className="bg-zinc-950/10">
            <td className="px-5 py-3.5 text-zinc-300 font-medium">Shared Chunk Overlap</td>
            <td className="px-5 py-3.5 font-mono text-amber-400" colSpan={2}>
              {overlapIds.length} shared chunk(s) retrieved by both strategies
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ComparisonView({
  resultA,
  resultB,
  overlapIds,
}: {
  resultA: QueryResponse;
  resultB: QueryResponse;
  overlapIds: string[];
}) {
  return (
    <div className="space-y-8">
      <MetricsTable resultA={resultA} resultB={resultB} overlapIds={overlapIds} />

      <div className="card p-6 space-y-4">
        <h3 className="label">Answer Diff Analysis</h3>
        <div className="rounded-lg overflow-hidden border border-zinc-800 text-xs">
          <ReactDiffViewer
            oldValue={resultA.answer}
            newValue={resultB.answer}
            splitView={true}
            leftTitle={`A: ${resultA.strategy.toUpperCase()}`}
            rightTitle={`B: ${resultB.strategy.toUpperCase()}`}
            useDarkTheme={true}
            styles={{
              variables: {
                dark: {
                  diffViewerBackground: "#09090b",
                  addedBackground: "rgba(16, 185, 129, 0.15)",
                  addedColor: "#a7f3d0",
                  removedBackground: "rgba(244, 63, 94, 0.15)",
                  removedColor: "#fecdd3",
                  wordAddedBackground: "rgba(16, 185, 129, 0.3)",
                  wordRemovedBackground: "rgba(244, 63, 94, 0.3)",
                  gutterColor: "#52525b",
                  gutterBackground: "#18181b",
                },
              },
            }}
          />
        </div>
      </div>

      {(resultA.pipeline?.length > 0 || resultB.pipeline?.length > 0) && (
        <div className="card p-6 space-y-4">
          <h3 className="label">Pipeline Trace Comparison</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gold-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  A — {resultA.strategy.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono ml-auto">{resultA.latency_ms.toFixed(0)} ms</span>
              </div>
              <PipelineVisualizer steps={resultA.pipeline || []} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  B — {resultB.strategy.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono ml-auto">{resultB.latency_ms.toFixed(0)} ms</span>
              </div>
              <PipelineVisualizer steps={resultB.pipeline || []} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <span className="h-2 w-2 rounded-full bg-gold-500 shadow-md shadow-gold-500/50" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Strategy A — {resultA.strategy.replace(/_/g, " ")}
            </h3>
          </div>
          <AnswerDisplay result={resultA} />
          <div className="space-y-2">
            <p className="label">Retrieved Chunks (A)</p>
            <ChunkInspector chunks={resultA.chunks} overlapIds={overlapIds} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Strategy B — {resultB.strategy.replace(/_/g, " ")}
            </h3>
          </div>
          <AnswerDisplay result={resultB} />
          <div className="space-y-2">
            <p className="label">Retrieved Chunks (B)</p>
            <ChunkInspector chunks={resultB.chunks} overlapIds={overlapIds} />
          </div>
        </div>
      </div>
    </div>
  );
}
