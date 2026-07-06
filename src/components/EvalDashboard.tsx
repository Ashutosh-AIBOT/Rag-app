"use client";
import { useState, Fragment, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api, pollJob } from "@/lib/api";
import Spinner from "./ui/Spinner";
import CopyButton from "./ui/CopyButton";

const ALL_STRATEGIES = ["basic_vector", "hybrid", "hybrid_rerank", "parent_child", "multi_query", "hyde", "decomposition", "step_back", "auto", "multi_vector"];
const METRIC_KEYS = ["faithfulness", "answer_relevancy", "context_precision", "context_recall"];
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e"];

function scoreColor(score: number) {
  if (score >= 0.75) return "text-emerald-400";
  if (score >= 0.5) return "text-amber-400";
  return "text-rose-400";
}

function ParamCard({ children }: { children: React.ReactNode }) {
  return <div className="card p-6 space-y-6">{children}</div>;
}

function exportToCsv(results: any[], batchId: string) {
  if (!results.length) return;
  const headers = ["Question", "Strategy", "Faithfulness", "Relevancy", "Precision", "Recall", "Average", "Passed", "Generated Answer"];
  const rows = results.map((r) => {
    const avg = ((r.faithfulness + r.answer_relevancy + r.context_precision + r.context_recall) / 4).toFixed(3);
    return [
      `"${(r.question || "").replace(/"/g, '""')}"`,
      r.strategy,
      r.faithfulness.toFixed(3),
      r.answer_relevancy.toFixed(3),
      r.context_precision.toFixed(3),
      r.context_recall.toFixed(3),
      avg,
      r.passed ? "Pass" : "Fail",
      `"${(r.generated_answer || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
    ].join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `eval-${batchId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function ChartView({ chartData, batchId }: { chartData: any[]; batchId: string }) {
  return (
    <div className="lg:col-span-2 card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <h3 className="label">Comparative Metrics</h3>
        <span className="text-[10px] text-zinc-500 font-mono">Batch ID: {batchId.slice(0, 8)}</span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" />
          <XAxis dataKey="strategy" stroke="#71717a" fontSize={9} tickLine={false} />
          <YAxis domain={[0, 1]} stroke="#71717a" fontSize={10} tickLine={false} />
          <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: "8px" }} itemStyle={{ fontSize: "11px" }} labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "#a1a1aa", marginBottom: "4px" }} />
          <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
          {METRIC_KEYS.map((k, i) => (
            <Bar key={k} dataKey={k} name={k.replaceAll("_", " ").toUpperCase()} fill={COLORS[i]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Leaderboard({ leaderboard }: { leaderboard: { strategy: string; average: number }[] }) {
  const gradients = ["from-emerald-500 to-teal-500", "from-indigo-500 to-violet-500", "from-zinc-500 to-zinc-650"];
  return (
    <div className="card p-6 space-y-4">
      <div className="border-b border-zinc-850 pb-3">
        <h3 className="label">Leaderboard</h3>
      </div>
      <div className="space-y-4">
        {leaderboard.map((row, i) => (
          <div key={row.strategy} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-zinc-500">#{i + 1}</span>
                <span className="font-medium text-zinc-200 capitalize">{row.strategy.replace(/_/g, " ")}</span>
              </div>
              <span className="font-mono font-bold text-zinc-100">{row.average.toFixed(2)}</span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className={`h-full bg-gradient-to-r ${gradients[Math.min(i, 2)]} rounded-full`} style={{ width: `${row.average * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EvalDashboard() {
  const [selected, setSelected] = useState<string[]>(["basic_vector", "hybrid", "hybrid_rerank", "parent_child", "hyde"]);
  const [limit, setLimit] = useState(10);
  const [useRagas, setUseRagas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [summary, setSummary] = useState<Record<string, Record<string, number>> | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [failuresOnly, setFailuresOnly] = useState(false);
  const [pastBatches, setPastBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const loadBatches = async () => {
    try {
      const list = await api.listBatches();
      setPastBatches(list.filter((b) => b.status === "done" && b.summary && Object.keys(b.summary).length > 0));
    } catch (e) {
      console.error("Failed to load batches:", e);
    }
  };

  useEffect(() => { loadBatches(); }, []);

  const handleSelectBatch = async (bid: string) => {
    setSelectedBatchId(bid);
    if (!bid) { setSummary(null); setResults([]); setBatchId(null); return; }
    const match = pastBatches.find((b) => b.batch_id === bid);
    if (match) {
      setSummary(match.summary); setBatchId(bid); setResultsLoading(true);
      try { setResults(await api.evalResults(bid)); } catch (e: any) { setError(e.message); } finally { setResultsLoading(false); }
    }
  };

  const toggle = (s: string) => setSelected((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);

  const run = async () => {
    setLoading(true); setError(null); setProgress(null); setResults([]);
    try {
      const { job_id, batch_id } = await api.evaluateBatch(selected, limit, useRagas);
      setBatchId(batch_id);
      const finalJob = await pollJob(() => api.getEvalJob(job_id), (job) => setProgress({ done: job.completed_steps, total: job.total_steps }));
      if (finalJob.status === "failed") { setError(finalJob.error || "Evaluation job failed."); }
      else {
        setSummary(finalJob.summary); setResultsLoading(true);
        try { setResults(await api.evalResults(batch_id)); await loadBatches(); setSelectedBatchId(batch_id); }
        finally { setResultsLoading(false); }
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const chartData = summary ? Object.entries(summary).map(([strategy, scores]) => ({ strategy: strategy.replace(/_/g, " ").toUpperCase(), ...scores })) : [];
  const leaderboard = summary ? Object.entries(summary).map(([strategy, scores]) => ({ strategy, average: scores.average })).sort((a, b) => b.average - a.average) : [];

  return (
    <div className="space-y-8">
      <ParamCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <h2 className="text-sm font-semibold text-zinc-100">Benchmark Parameters</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">Run the evaluation suite of question-answer pairs against your selected search configurations.</p>
          </div>
          {pastBatches.length > 0 && (
            <div className="w-full md:w-80 space-y-1.5 shrink-0">
              <label className="label">Load Past Batch</label>
              <div className="relative">
                <select value={selectedBatchId} onChange={(e) => handleSelectBatch(e.target.value)} className="input-field cursor-pointer appearance-none">
                  <option value="">-- Run New Evaluation --</option>
                  {pastBatches.map((b) => (
                    <option key={b.batch_id} value={b.batch_id}>{b.batch_id.slice(0, 8)} ({new Date(b.created_at).toLocaleDateString()})</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="label">Select Retrieval Strategies</label>
          <div className="flex flex-wrap gap-2">
            {ALL_STRATEGIES.map((s) => (
              <button key={s} onClick={() => toggle(s)} className={`text-xs px-3.5 py-1.5 rounded-full border transition-all duration-200 ${selected.includes(s) ? "bg-indigo-500/10 border-indigo-500/80 text-indigo-400 font-medium" : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-750"}`}>
                {s.replace(/_/g, " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/80 pt-5">
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-1.5">
              <label className="label">Limit Questions</label>
              <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-24 input-field" />
            </div>
            <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none self-end pb-2">
              <input type="checkbox" checked={useRagas} onChange={(e) => setUseRagas(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 bg-zinc-900 border-zinc-700 focus:ring-indigo-500/50 focus:ring-offset-zinc-950" />
              <span>Compute RAGAS Metrics</span>
            </label>
          </div>
          <button onClick={run} disabled={loading || selected.length === 0} className="btn-primary">
            {loading ? <span className="flex items-center justify-center gap-2"><Spinner size="h-4 w-4" /> Evaluating...</span> : "Run Suite"}
          </button>
        </div>

        {loading && progress && (
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span>Job Progress</span>
              <span className="font-mono">{progress.done} / {progress.total} iterations</span>
            </div>
            <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-805">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300" style={{ width: `${progress.total ? (100 * progress.done) / progress.total : 0}%` }} />
            </div>
          </div>
        )}
        {error && <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">{error}</div>}
      </ParamCard>

      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ChartView chartData={chartData} batchId={batchId || ""} />
          <Leaderboard leaderboard={leaderboard} />
        </div>
      )}

      {summary && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="label">
              Iterative Evaluation Logs {resultsLoading && <span className="animate-pulse text-indigo-400 text-[10px] ml-2 lowercase">Updating...</span>}
            </h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer select-none">
                <input type="checkbox" checked={failuresOnly} onChange={(e) => setFailuresOnly(e.target.checked)} className="w-3.5 h-3.5 rounded text-indigo-600 bg-zinc-950 border-zinc-800 focus:ring-indigo-500/50" />
                <span>Show Failures Only</span>
              </label>
              {results.length > 0 && (
                <button onClick={() => exportToCsv(results, batchId || "batch")} className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-all font-medium flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Export CSV
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-zinc-950/20 text-zinc-400 border-b border-zinc-800 font-semibold">
                  <th className="px-5 py-3">Question</th>
                  <th className="px-5 py-3">Strategy</th>
                  <th className="px-5 py-3">Faithfulness</th>
                  <th className="px-5 py-3">Relevancy</th>
                  <th className="px-5 py-3">Precision</th>
                  <th className="px-5 py-3">Recall</th>
                  <th className="px-5 py-3">Avg</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {(failuresOnly ? results.filter((r) => !r.passed) : results).map((r) => {
                  const isOpen = expandedResult === r.id;
                  const avgScore = (r.faithfulness + r.answer_relevancy + r.context_precision + r.context_recall) / 4;
                  return (
                    <Fragment key={r.id}>
                      <tr className="hover:bg-zinc-950/10 transition-colors">
                        <td className="px-5 py-3.5 max-w-xs truncate text-zinc-300 font-medium">{r.question}</td>
                        <td className="px-5 py-3.5 font-mono text-zinc-400 uppercase text-[9px] tracking-wider bg-zinc-950/30">{r.strategy.replace(/_/g, " ")}</td>
                        <td className={`px-5 py-3.5 font-mono ${scoreColor(r.faithfulness)}`}>{r.faithfulness.toFixed(2)}</td>
                        <td className={`px-5 py-3.5 font-mono ${scoreColor(r.answer_relevancy)}`}>{r.answer_relevancy.toFixed(2)}</td>
                        <td className={`px-5 py-3.5 font-mono ${scoreColor(r.context_precision)}`}>{r.context_precision.toFixed(2)}</td>
                        <td className={`px-5 py-3.5 font-mono ${scoreColor(r.context_recall)}`}>{r.context_recall.toFixed(2)}</td>
                        <td className={`px-5 py-3.5 font-mono ${scoreColor(avgScore)}`}>{avgScore.toFixed(2)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${r.passed ? "badge-green" : "badge-rose"}`}>
                            {r.passed ? "Pass" : "Fail"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => setExpandedResult(isOpen ? null : r.id)} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition">
                            {isOpen ? "Collapse" : "Inspect Trace"}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={9} className="bg-zinc-950/60 p-6 space-y-4 border-b border-zinc-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                <div className="label">Generated Answer</div>
                                <div className="bg-zinc-900 border border-zinc-850 rounded-lg p-4 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed shadow-inner">{r.generated_answer}</div>
                              </div>
                              <div className="space-y-1.5">
                                <div className="label">Reference Answer</div>
                                <div className="bg-zinc-900 border border-zinc-850 rounded-lg p-4 font-mono text-[11px] text-zinc-400 whitespace-pre-wrap leading-relaxed shadow-inner">{r.reference_answer}</div>
                              </div>
                            </div>
                            {r.trace?.pipeline && (
                              <div className="space-y-2">
                                <div className="label">Pipeline Trace</div>
                                <div className="bg-zinc-900/40 border border-zinc-850 rounded-lg p-4 space-y-2 text-xs">
                                  {r.trace.pipeline.map((step: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 items-start font-mono leading-relaxed">
                                      <span className="text-indigo-400 font-bold shrink-0 min-w-[120px] uppercase text-[10px] tracking-wider">{step.name}:</span>
                                      <span className="text-zinc-450 truncate" title={JSON.stringify(step.detail)}>{JSON.stringify(step.detail)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {results.length === 0 && !resultsLoading && (
              <div className="text-zinc-500 text-xs py-8 text-center bg-zinc-900/10">No evaluation iterations logged for this batch run.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
