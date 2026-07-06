import EvalDashboard from "@/components/EvalDashboard";

export default function EvaluatePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">RAG Evaluation Dashboard</h1>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">
          Benchmark all retrieval strategy workflows against a test suite dataset. Measure faithfulness, answer relevancy, context precision, and recall.
        </p>
      </div>
      <EvalDashboard />
    </div>
  );
}
