"use client";
import { useEffect, useState, useRef } from "react";
import { api, DocumentOut, DocumentChunksOut, IngestionJob, pollJob } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import ChunkOverlapViewer from "./ChunkOverlapViewer";
import Spinner from "./ui/Spinner";
import Badge from "./ui/Badge";

interface ActiveUpload {
  jobId: string;
  filename: string;
  progress: number;
  message: string;
  status: IngestionJob["status"];
  error?: string | null;
}

function UploadProgress({ uploads }: { uploads: ActiveUpload[] }) {
  if (uploads.length === 0) return null;
  return (
    <div className="space-y-3 pt-2 border-t border-zinc-800/60">
      <div className="label">Active Ingestions</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {uploads.map((u) => {
          const isFailed = u.status === "failed";
          const isDone = u.status === "done";
          return (
            <div key={u.jobId} className="bg-zinc-950 border border-zinc-800/70 rounded-lg p-4 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-200 truncate max-w-[70%]">{u.filename}</span>
                <span className={`font-mono font-bold text-[10px] uppercase ${isFailed ? "text-rose-400" : isDone ? "text-emerald-400" : "text-amber-400"}`}>
                  {isFailed ? "Failed" : isDone ? "Ready" : `${u.progress}%`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/70">
                <div className={`h-full transition-all duration-300 ${isFailed ? "bg-rose-500" : isDone ? "bg-emerald-500" : "bg-gold-500"}`} style={{ width: `${isFailed ? 100 : u.progress}%` }} />
              </div>
              <div className="text-[10px] text-zinc-500 truncate">{u.error ?? u.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocCard({
  doc,
  isSelected,
  isExpanded,
  onToggleExpand,
  onDelete,
  onToggleSelect,
  chunksByDoc,
  chunksLoading,
  activeStrategyTab,
  setActiveStrategyTab,
  drawerTab,
  setDrawerTab,
}: {
  doc: DocumentOut;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onToggleSelect: () => void;
  chunksByDoc: Record<string, DocumentChunksOut>;
  chunksLoading: string | null;
  activeStrategyTab: Record<string, string>;
  setActiveStrategyTab: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  drawerTab: Record<string, "chunks" | "overlap">;
  setDrawerTab: React.Dispatch<React.SetStateAction<Record<string, "chunks" | "overlap">>>;
}) {
  const isReady = doc.status === "ready";
  const statusVariant = doc.status === "ready" ? "green" : doc.status === "failed" ? "rose" : "amber";

  return (
    <div className={`border rounded-xl bg-zinc-900 overflow-hidden transition-all duration-200 ${isSelected ? "border-gold-500/50 shadow-md shadow-gold-500/5" : "border-zinc-800"}`}>
      <div className="flex items-center justify-between px-5 py-4 hover:bg-zinc-950/10 transition-colors">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {isReady && (
            <input type="checkbox" checked={isSelected} onChange={onToggleSelect} className="w-4 h-4 rounded text-gold-600 bg-zinc-950 border-zinc-800/70 focus:ring-gold-500/50 cursor-pointer shrink-0" />
          )}
          <button className="text-left flex-1 min-w-0" onClick={onToggleExpand}>
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-sm text-zinc-200 truncate">{doc.filename}</span>
              <Badge variant={statusVariant}>{doc.status}</Badge>
            </div>
            <div className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/70 font-mono text-[10px] text-zinc-400">{doc.file_type.toUpperCase()}</span>
              <span>{doc.total_pages} page(s)</span>
              <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
              <span>{new Date(doc.upload_date).toLocaleDateString()}</span>
              {doc.tags.length > 0 && <span className="text-gold-400/90 font-medium">tags: {doc.tags.join(", ")}</span>}
            </div>
          </button>
        </div>
        <button onClick={onDelete} className="text-xs text-zinc-500 hover:text-rose-400 font-semibold px-3 py-1.5 border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 rounded-lg transition-all ml-4 shrink-0">
          Delete
        </button>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-zinc-800/70 bg-zinc-950/40 pt-4 space-y-4">
          <div className="space-y-2">
            <div className="label">Chunk Count Breakdown</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(doc.chunk_counts).map(([strategy, count]) => (
                <div key={strategy} className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 truncate">{strategy.replace(/_/g, " ")}</div>
                  <div className="font-mono text-lg font-bold text-zinc-200 mt-1">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 border-b border-zinc-800 pb-0">
            {(["chunks", "overlap"] as const).map((tab) => {
              const active = (drawerTab[doc.id] ?? "chunks") === tab;
              return (
                <button key={tab} onClick={() => setDrawerTab((cur) => ({ ...cur, [doc.id]: tab }))} className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2 border-b-2 transition-all ${active ? "border-gold-500 text-gold-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                  {tab === "chunks" ? "Chunk Browser" : "Overlap Map"}
                </button>
              );
            })}
          </div>

          {(drawerTab[doc.id] ?? "chunks") === "chunks" && (
            <div className="space-y-2.5">
              <div className="label">Chunk Browser {chunksLoading === doc.id && <span className="animate-pulse text-gold-400 lowercase ml-1">Loading...</span>}</div>
              {chunksByDoc[doc.id] && (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(chunksByDoc[doc.id].by_strategy).map((strategy) => (
                      <button key={strategy} onClick={() => setActiveStrategyTab((cur) => ({ ...cur, [doc.id]: strategy }))} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${activeStrategyTab[doc.id] === strategy ? "bg-gold-600 border-gold-500 text-white shadow-md shadow-gold-500/15" : "bg-zinc-900 border-zinc-800/70 text-zinc-400 hover:text-zinc-200"}`}>
                        {strategy.replace(/_/g, " ")} ({chunksByDoc[doc.id].by_strategy[strategy].length})
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {(chunksByDoc[doc.id].by_strategy[activeStrategyTab[doc.id]] || []).map((c) => (
                      <div key={c.chunk_id} className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800/70 pb-1.5 font-mono">
                          <span>{c.page ? `Page ${c.page}` : "Meta"}</span>
                          {c.section && <span className="truncate max-w-[200px]">{c.section}</span>}
                        </div>
                        <div className="text-zinc-300 leading-relaxed font-sans">{c.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(drawerTab[doc.id] ?? "chunks") === "overlap" && (
            <ChunkOverlapViewer docId={doc.id} filename={doc.filename} />
          )}
        </div>
      )}
    </div>
  );
}

export default function DocumentList() {
  const [docs, setDocs] = useState<DocumentOut[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [tags, setTags] = useState("");
  const [uploads, setUploads] = useState<Record<string, ActiveUpload>>({});
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chunksByDoc, setChunksByDoc] = useState<Record<string, DocumentChunksOut>>({});
  const [chunksLoading, setChunksLoading] = useState<string | null>(null);
  const [activeStrategyTab, setActiveStrategyTab] = useState<Record<string, string>>({});
  const [drawerTab, setDrawerTab] = useState<Record<string, "chunks" | "overlap">>({});
  const pollingDocs = useRef<Set<string>>(new Set());
  const selectedSources = useAppStore((s) => s.selectedSources);
  const setSelectedSources = useAppStore((s) => s.setSelectedSources);
  const isInitialized = useRef(false);

  const refresh = () => api.listDocuments().then((data) => {
    setDocs(data);
    setDocsLoading(false);
    if (!isInitialized.current && selectedSources.length === 0 && data.length > 0) {
      const ready = data.filter((d) => d.status === "ready").map((d) => d.filename);
      if (ready.length > 0) { setSelectedSources(ready); }
      isInitialized.current = true;
    }
  }).catch(() => {});

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    for (const file of files) {
      try {
        const accepted = await api.uploadDocument(file, tags);
        await refresh();
        const jobId = accepted.job_id;
        setUploads((cur) => ({ ...cur, [jobId]: { jobId, filename: file.name, progress: 0, message: "Queued...", status: "queued" } }));
        pollJob(() => api.getIngestionJob(jobId), (job) => {
          setUploads((cur) => ({ ...cur, [jobId]: { jobId, filename: file.name, progress: job.progress, message: job.message, status: job.status, error: job.error } }));
          if (job.status === "done" || job.status === "failed") {
            if (job.status === "done") setSelectedSources((prev) => [...new Set([...prev, file.name])]);
            refresh();
            setTimeout(() => { setUploads((cur) => { const { [jobId]: _, ...rest } = cur; return rest; }); }, 4000);
          }
        });
      } catch (err: any) { setError(err.message); }
    }
  };

  const handleDelete = async (id: string) => { await api.deleteDocument(id); await refresh(); };

  const toggleExpand = async (docId: string) => {
    const opening = expanded !== docId;
    setExpanded(opening ? docId : null);
    if (opening && !chunksByDoc[docId]) {
      setChunksLoading(docId);
      try {
        const data = await api.getDocumentChunks(docId);
        setChunksByDoc((cur) => ({ ...cur, [docId]: data }));
        const first = Object.keys(data.by_strategy)[0];
        if (first) setActiveStrategyTab((cur) => ({ ...cur, [docId]: first }));
      } catch {} finally { setChunksLoading(null); }
    }
  };

  return (
    <div className="space-y-8">
      <div className="card p-6 space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-zinc-100">Upload Documents</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Support for PDF, TXT, DOCX, and Markdown formats. Ingestions run asynchronously with 4 chunking strategies.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1.5">
            <label className="label">Assign Tags (Optional)</label>
            <input placeholder="e.g. finance, legal, v2" value={tags} onChange={(e) => setTags(e.target.value)} className="input-field" />
          </div>
          <label className="btn-primary cursor-pointer shrink-0">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Choose File(s)
            <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.txt,.docx,.md" />
          </label>
        </div>
        {error && <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">{error}</div>}
        <UploadProgress uploads={Object.values(uploads)} />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="label">Ingested Index ({docs.length})</h3>
          {docs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 mr-2">Active: <strong>{selectedSources.length}</strong> / {docs.filter((d) => d.status === "ready").length}</span>
              <button onClick={() => setSelectedSources(docs.filter((d) => d.status === "ready").map((d) => d.filename))} className="text-[10px] font-semibold text-zinc-300 bg-zinc-950 border border-zinc-800/70 hover:border-zinc-700 px-2.5 py-1.5 rounded-lg transition">Select All</button>
              <button onClick={() => setSelectedSources([])} className="text-[10px] font-semibold text-zinc-300 bg-zinc-950 border border-zinc-800/70 hover:border-zinc-700 px-2.5 py-1.5 rounded-lg transition">Deselect All</button>
            </div>
          )}
        </div>
        {docsLoading ? (
          <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur-md p-8 text-zinc-500 text-sm text-center flex items-center justify-center gap-2">
            <Spinner size="h-4 w-4" /> Loading documents...
          </div>
        ) : docs.length === 0 ? (
          <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur-md p-8 text-zinc-500 text-sm text-center">No indexed documents found. Upload text assets to begin.</div>
        ) : null}
        <div className="space-y-3">
          {docs.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              isSelected={selectedSources.includes(doc.filename)}
              isExpanded={expanded === doc.id}
              onToggleExpand={() => toggleExpand(doc.id)}
              onDelete={() => handleDelete(doc.id)}
              onToggleSelect={() => setSelectedSources((prev) => prev.includes(doc.filename) ? prev.filter((s) => s !== doc.filename) : [...prev, doc.filename])}
              chunksByDoc={chunksByDoc}
              chunksLoading={chunksLoading}
              activeStrategyTab={activeStrategyTab}
              setActiveStrategyTab={setActiveStrategyTab}
              drawerTab={drawerTab}
              setDrawerTab={setDrawerTab}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
