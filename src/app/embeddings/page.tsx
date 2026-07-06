"use client";
import { useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { API_URL } from "@/lib/api";

export default function EmbeddingsPage() {
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog");
  const [modelA, setModelA] = useState("nvidia/nv-embedqa-e5-v5");
  const [modelB, setModelB] = useState("sentence-transformers/all-MiniLM-L6-v2");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const compare = async () => {
    if (!text.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_URL}/api/embeddings/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, model_a: modelA, model_b: modelB }),
      });
      if (!res.ok) throw new Error("Comparison failed");
      setResults(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Embedding Model Comparison</h1>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">
          Compare vector outputs from different embedding models side-by-side. Visualize dimension differences and similarity scores.
        </p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="space-y-1.5">
          <label className="label">Input Text</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="input-field resize-none" placeholder="Enter text to embed..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="label">Model A</label>
            <input value={modelA} onChange={(e) => setModelA(e.target.value)} className="input-field font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="label">Model B</label>
            <input value={modelB} onChange={(e) => setModelB(e.target.value)} className="input-field font-mono text-xs" />
          </div>
        </div>

        {error && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">{error}</div>}

        <div className="flex justify-end">
          <button onClick={compare} disabled={loading} className="btn-primary">
            {loading ? <span className="flex items-center justify-center gap-2"><Spinner size="h-4 w-4" /> Comparing...</span> : "Compare Embeddings"}
          </button>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[results.model_a, results.model_b].map((m: any, i: number) => (
            <div key={i} className="card p-6 space-y-4">
              <h3 className="label">{i === 0 ? "Model A" : "Model B"}: {m.model}</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div className="label">Dimensions</div>
                  <div className="font-mono text-sm font-semibold text-zinc-200 mt-0.5">{m.dimensions}</div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div className="label">Magnitude</div>
                  <div className="font-mono text-sm font-semibold text-zinc-200 mt-0.5">{m.magnitude?.toFixed(4)}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="label">First 10 Values</div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[10px] text-zinc-400">
                  [{m.embedding.slice(0, 10).map((v: number) => v.toFixed(6)).join(", ")} ...]
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
