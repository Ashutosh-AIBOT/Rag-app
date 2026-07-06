"use client";
import ReactMarkdown from "react-markdown";
import { QueryResponse } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import CopyButton from "./ui/CopyButton";
import Badge from "./ui/Badge";

function scoreColor(score: number) {
  if (score >= 0.75) return "text-emerald-400";
  if (score >= 0.5) return "text-amber-400";
  return "text-rose-400";
}

const markdownComponents = {
  p: ({ children }: any) => <p className="text-sm leading-relaxed text-zinc-300 mb-4 last:mb-0">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-lg font-bold text-white mb-4 mt-6">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-base font-semibold text-white mb-3 mt-5">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-semibold text-zinc-200 mb-2 mt-4">{children}</h3>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-zinc-300 text-sm">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-zinc-300 text-sm">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }: any) => (
    <code className="bg-zinc-950 text-indigo-300 font-mono text-xs px-1.5 py-0.5 rounded border border-zinc-800/80">{children}</code>
  ),
  pre: ({ children }: any) => (
    <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-x-auto text-zinc-300 mb-4 leading-relaxed">{children}</pre>
  ),
  a: ({ href, children }: any) => (
    <a href={href} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition" target="_blank" rel="noreferrer">{children}</a>
  ),
};

export default function AnswerDisplay({ result }: { result: QueryResponse | null }) {
  const setHighlightSource = useAppStore((s) => s.setHighlightSource);
  const highlightSource = useAppStore((s) => s.highlightSource);

  if (!result) {
    return (
      <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur-md p-6 text-zinc-500 text-sm text-center flex flex-col items-center justify-center min-h-[200px]">
        <svg className="h-8 w-8 text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>Enter a query above to retrieve documents and synthesize an answer.</span>
      </div>
    );
  }

  const sources = [...new Set(result.chunks.map((c) => c.source))];

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-3">
        <span className="flex items-center gap-1.5">
          Strategy: <Badge variant="indigo">{result.strategy.replace(/_/g, " ")}</Badge>
        </span>
        <div className="flex items-center gap-3">
          <CopyButton text={result.answer} />
          <span className="font-mono text-zinc-500">{result.latency_ms.toFixed(0)} ms</span>
        </div>
      </div>

      <div className="leading-relaxed">
        <ReactMarkdown components={markdownComponents}>{result.answer}</ReactMarkdown>
      </div>

      {sources.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 self-center mr-1">
            Sources (Click to highlight):
          </span>
          {sources.map((s) => {
            const active = highlightSource === s;
            return (
              <button
                key={s}
                onClick={() => setHighlightSource(active ? null : s)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all ${
                  active
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      )}

      {(result.faithfulness != null || result.answer_relevancy != null) && (
        <div className="flex flex-wrap gap-6 text-[11px] font-semibold border-t border-zinc-800 pt-4">
          {result.faithfulness != null && (
            <span className="flex items-center gap-1.5">
              <span className="uppercase tracking-wider text-zinc-400">Faithfulness:</span>
              <span className={`font-mono ${scoreColor(result.faithfulness)}`}>{result.faithfulness.toFixed(2)}</span>
            </span>
          )}
          {result.answer_relevancy != null && (
            <span className="flex items-center gap-1.5">
              <span className="uppercase tracking-wider text-zinc-400">Answer Relevancy:</span>
              <span className={`font-mono ${scoreColor(result.answer_relevancy)}`}>{result.answer_relevancy.toFixed(2)}</span>
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-t border-zinc-800 pt-4">
        <span className="flex items-center gap-1">Input Tokens: <span className="font-mono text-zinc-300">{result.input_tokens}</span></span>
        <span className="flex items-center gap-1">Output Tokens: <span className="font-mono text-zinc-300">{result.output_tokens}</span></span>
        <span className="flex items-center gap-1">Chunks: <span className="font-mono text-zinc-300">{result.chunks.length}</span></span>
        {!!result.estimated_cost_usd && (
          <span className="flex items-center gap-1 ml-auto">
            Est. Cost: <span className="font-mono text-zinc-300 text-indigo-400 normal-case">${result.estimated_cost_usd.toFixed(6)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
