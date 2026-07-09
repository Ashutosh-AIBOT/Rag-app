"use client";
export default function DocumentsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card p-8 text-center space-y-4">
      <div className="text-rose-400 text-sm font-semibold">Documents Error</div>
      <p className="text-xs text-zinc-500">{error.message}</p>
      <button onClick={reset} className="btn-primary text-xs">Try Again</button>
    </div>
  );
}
