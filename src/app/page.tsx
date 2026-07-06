"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const FEATURES = [
  {
    title: "Hybrid Search",
    description: "Semantic vector search combined with BM25 keyword matching via Reciprocal Rank Fusion for superior recall.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "10 Retrieval Strategies",
    description: "From basic vector search to multi-query, HyDE, decomposition, step-back, and auto-selection.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    title: "Cross-Encoder Re-Ranking",
    description: "Precision-focused reranking of retrieved chunks using cross-encoder models for higher quality results.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 4h18M3 8h18M3 12h18M3 16h18M3 20h18" />
      </svg>
    ),
  },
  {
    title: "Query Transformation",
    description: "HyDE, multi-query, decomposition, and step-back strategies to improve retrieval quality.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    title: "RAG Evaluation",
    description: "LLM-as-judge evaluation with faithfulness, relevancy, precision, and recall metrics.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Pipeline Visualization",
    description: "Real-time execution tracing showing every step from query to answer with latency breakdowns.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const CHUNKING_STRATEGIES = [
  { name: "Recursive Character", description: "Splits text by separators (\\n\\n, \\n, . , space) with 500-token chunks and 50-token overlap. Fast and reliable for most documents." },
  { name: "Semantic Chunking", description: "Embeds each sentence and splits where semantic distance crosses a percentile breakpoint. Produces semantically coherent chunks." },
  { name: "Parent-Child", description: "Small 200-token child chunks for retrieval, but returns the full 1000-token parent chunk to the LLM for context." },
  { name: "Section-Based", description: "Groups content by detected headings (H1/H2) into single chunks per section. Ideal for structured reports and manuals." },
  { name: "Multi-Vector (Bonus)", description: "Generates summaries + hypothetical questions per chunk. Retrieval uses richer semantic signals than raw text." },
];

const PIPELINE_STEPS = [
  { step: "1", title: "Document Upload", description: "Upload PDF, TXT, DOCX, or Markdown files with custom tags", color: "bg-emerald-500" },
  { step: "2", title: "Chunking", description: "5 strategies: recursive, semantic, parent-child, section, multi-vector", color: "bg-blue-500" },
  { step: "3", title: "Indexing", description: "ChromaDB vectors + BM25 inverted index with user-level isolation", color: "bg-violet-500" },
  { step: "4", title: "Query & Retrieval", description: "10 strategies with query transformation and metadata filtering", color: "bg-amber-500" },
  { step: "5", title: "Re-Ranking", description: "Cross-encoder precision reranking for top results", color: "bg-rose-500" },
  { step: "6", title: "Generation", description: "LLM synthesis with source citations and confidence scores", color: "bg-indigo-500" },
];

function AnimatedCounter({ target, label }: { target: number; label: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white tabular-nums">{count.toLocaleString()}</div>
      <div className="text-xs text-zinc-400 mt-1">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.health().then(setHealth).catch(() => {});
  }, []);

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950" />

        <div className="relative z-10 text-center space-y-8 px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Production-ready RAG pipeline
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-300 bg-clip-text text-transparent">Advanced </span>
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">RAG Engine</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Hybrid search, re-ranking, multi-strategy retrieval, query transformation, and RAG evaluation — everything you need to build a production-grade retrieval-augmented generation system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="px-8 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all">
              Get Started Free
            </Link>
            <Link href="/login" className="px-8 py-3 rounded-lg text-sm font-medium text-zinc-300 border border-zinc-700 hover:border-zinc-500 hover:text-white transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-zinc-800 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedCounter target={stats?.total_queries || 0} label="Queries Executed" />
          <AnimatedCounter target={stats?.total_documents || 0} label="Documents Indexed" />
          <AnimatedCounter target={Math.round(stats?.avg_latency_ms || 0)} label="Avg Latency (ms)" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white truncate">{health?.llm?.active_provider || "LLM"}</div>
            <div className="text-xs text-zinc-400 mt-1">Active Provider</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">Everything you need for production RAG</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">A complete pipeline from document ingestion to answer generation, with every component configurable and observable.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Pipeline Flow */}
      <section className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">How it works</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">From document upload to answer generation in six steps.</p>
          </div>

          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800" />

            <div className="space-y-8">
              {PIPELINE_STEPS.map((s) => (
                <div key={s.step} className="relative flex items-start gap-6 pl-0">
                  <div className={`relative z-10 h-12 w-12 rounded-full ${s.color} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg`}>
                    {s.step}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-md">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chunking Strategies */}
      <section className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">5 Chunking Strategies</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">Choose the right splitting strategy for your documents. Each produces chunks tagged for A/B comparison.</p>
          </div>

          <div className="space-y-4">
            {CHUNKING_STRATEGIES.map((s, i) => (
              <div key={s.name} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Retrieval Strategies */}
      <section className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">10 Retrieval Strategies</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">From simple vector search to intelligent auto-selection. Compare them side by side with A/B testing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Basic Vector", desc: "Standard cosine-similarity vector search (baseline)." },
              { name: "Hybrid", desc: "Semantic + BM25 combined via Reciprocal Rank Fusion." },
              { name: "Hybrid + Rerank", desc: "Hybrid retrieval, top-20, then cross-encoder rerank to top-5." },
              { name: "Parent-Child", desc: "Search small child chunks, return larger parent chunks." },
              { name: "Multi-Query", desc: "LLM generates query variants, merges results across all." },
              { name: "HyDE", desc: "Embeds a hypothetical LLM-generated answer instead of raw query." },
              { name: "Decomposition", desc: "Breaks complex questions into sub-questions, retrieves each." },
              { name: "Step-Back", desc: "Generates a broader question alongside the specific one." },
              { name: "Auto", desc: "Picks the best strategy automatically based on query shape." },
              { name: "Multi-Vector", desc: "Indexes summaries + hypothetical questions per chunk." },
            ].map((s) => (
              <div key={s.name} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-indigo-500/30 transition-all">
                <h3 className="text-sm font-semibold text-indigo-400">{s.name}</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold text-white">Ready to explore?</h2>
          <p className="text-zinc-400">Start building production-grade RAG pipelines in minutes. Free to get started.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="px-8 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all">
              Create Free Account
            </Link>
            <Link href="/login" className="px-8 py-3 rounded-lg text-sm font-medium text-zinc-300 border border-zinc-700 hover:border-zinc-500 hover:text-white transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-zinc-400">RAG.Engine v2.0</span>
          </div>
          <p className="text-xs text-zinc-500">Advanced RAG Platform with Hybrid Search, Re-ranking &amp; Evaluation</p>
        </div>
      </footer>
    </div>
  );
}
