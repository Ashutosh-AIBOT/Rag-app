export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Auth helpers ───────────────────────────────────────────────────────────
/** Read the JWT stored by AuthContext on every request (always fresh). */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromLocal = localStorage.getItem("rag_token");
  if (fromLocal) return fromLocal;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Build Authorization header object if a token exists. */
function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Authenticated fetch — merges auth header into every request. */
async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface MetadataFilters {
  source?: string | string[] | null;
  page_min?: number | null;
  page_max?: number | null;
  section?: string | null;
  tags?: string[] | null;
  strategy?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  filter_logic?: "and" | "or";
}

export interface ChunkScore {
  chunk_id: string;
  text: string;
  source: string;
  page?: number;
  section?: string;
  strategy: string;
  semantic_score?: number;
  bm25_score?: number;
  rrf_score?: number;
  rerank_score?: number;
  original_rank?: number;
  final_rank?: number;
  child_text?: string;
}

export interface PipelineStep {
  name: string;
  detail: Record<string, any>;
  duration_ms: number;
}

export interface QueryResponse {
  query_id: string;
  query: string;
  strategy: string;
  answer: string;
  chunks: ChunkScore[];
  pipeline: PipelineStep[];
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  estimated_cost_usd?: number;
  faithfulness?: number | null;
  answer_relevancy?: number | null;
}

export interface DocumentChunkOut {
  chunk_id: string;
  text: string;
  page?: number;
  section?: string;
  strategy: string;
}

export interface DocumentChunksOut {
  doc_id: string;
  filename: string;
  by_strategy: Record<string, DocumentChunkOut[]>;
}

export interface QueryLogOut {
  id: string;
  query: string;
  strategy: string;
  filters: Record<string, any>;
  answer: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  created_at: string;
  trace?: any[];
  chunks?: ChunkScore[];
}

export interface DocumentOut {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  total_pages: number;
  tags: string[];
  upload_date: string;
  doc_date?: string;
  chunk_counts: Record<string, number>;
  status: string;
}

export interface ChunkSpan {
  chunk_id: string;
  text_preview: string;
  text_length: number;
  page?: number | null;
  section?: string;
  source?: string;
}

export interface ChunkOverlapData {
  doc_id: string;
  filename: string;
  total_chars_by_strategy: Record<string, number>;
  strategies: Record<string, ChunkSpan[]>;
}

export interface IngestionJob {
  id: string;
  doc_id: string;
  filename: string;
  status: "queued" | "running" | "done" | "failed";
  progress: number;
  message: string;
  error?: string | null;
  result: Record<string, number>;
}

export interface UploadAccepted {
  document: DocumentOut;
  job_id: string;
}

export interface EvalJob {
  id: string;
  batch_id: string;
  status: "queued" | "running" | "done" | "failed";
  total_steps: number;
  completed_steps: number;
  strategies: string[];
  error?: string | null;
  summary: Record<string, Record<string, number>>;
}

export interface BatchEvalAccepted {
  job_id: string;
  batch_id: string;
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  async listStrategies() {
    // Public endpoint — no auth required
    return j<{ id: string; description: string }[]>(await fetch(`${API_URL}/api/strategies`));
  },

  async listDocuments() {
    return j<DocumentOut[]>(await apiFetch(`${API_URL}/api/documents`));
  },

  async uploadDocument(file: File, tags: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("tags", tags);
    return j<UploadAccepted>(
      await apiFetch(`${API_URL}/api/documents/upload`, { method: "POST", body: form })
    );
  },

  async getIngestionJob(jobId: string) {
    return j<IngestionJob>(await apiFetch(`${API_URL}/api/documents/jobs/${jobId}`));
  },

  async deleteDocument(id: string) {
    return j<any>(await apiFetch(`${API_URL}/api/documents/${id}`, { method: "DELETE" }));
  },

  async getDocumentChunks(id: string) {
    return j<DocumentChunksOut>(await apiFetch(`${API_URL}/api/documents/${id}/chunks`));
  },

  async getChunkOverlap(id: string) {
    return j<ChunkOverlapData>(await apiFetch(`${API_URL}/api/documents/${id}/overlap`));
  },

  async queryHistory(limit = 20) {
    return j<QueryLogOut[]>(await apiFetch(`${API_URL}/api/query/history?limit=${limit}`));
  },

  async query(payload: {
    query: string;
    strategy: string;
    filters?: MetadataFilters;
    top_k_initial?: number;
    top_k_final?: number;
    semantic_weight?: number;
    bm25_weight?: number;
    compress_context?: boolean;
  }) {
    console.info(`[API] query: Sending request. Strategy=${payload.strategy}, Query="${payload.query}"`);
    try {
      const res = await j<QueryResponse>(
        await apiFetch(`${API_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters: {}, ...payload }),
        })
      );
      console.info(`[API] query: Received response successfully. Latency=${res.latency_ms}ms, Chunks=${res.chunks.length}`);
      return res;
    } catch (error) {
      console.error("[API] query: Failed request:", error);
      throw error;
    }
  },

  async compare(payload: {
    query: string;
    strategy_a: string;
    strategy_b: string;
    filters?: MetadataFilters;
    score_quality?: boolean;
  }) {
    console.info(`[API] compare: Sending A/B comparison request. StrategyA=${payload.strategy_a}, StrategyB=${payload.strategy_b}`);
    try {
      const res = await j<{ query: string; result_a: QueryResponse; result_b: QueryResponse; overlap_chunk_ids: string[] }>(
        await apiFetch(`${API_URL}/api/query/compare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters: {}, score_quality: true, ...payload }),
        })
      );
      console.info(`[API] compare: Received comparison. LatencyA=${res.result_a.latency_ms}ms, LatencyB=${res.result_b.latency_ms}ms, OverlapChunks=${res.overlap_chunk_ids.length}`);
      return res;
    } catch (error) {
      console.error("[API] compare: Failed request:", error);
      throw error;
    }
  },

  async evaluateBatch(strategies: string[], limit?: number, useRagas?: boolean) {
    return j<BatchEvalAccepted>(
      await apiFetch(`${API_URL}/api/evaluate/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategies, limit, use_ragas: !!useRagas }),
      })
    );
  },

  async getEvalJob(jobId: string) {
    return j<EvalJob>(await apiFetch(`${API_URL}/api/evaluate/batch/${jobId}`));
  },

  async evalResults(batchId?: string) {
    const url = batchId
      ? `${API_URL}/api/evaluate/results?batch_id=${batchId}`
      : `${API_URL}/api/evaluate/results`;
    return j<any[]>(await apiFetch(url));
  },

  async listBatches() {
    return j<EvalJob[]>(await apiFetch(`${API_URL}/api/evaluate/batches`));
  },

  async stats() {
    // Public endpoint — no auth required
    return j<any>(await fetch(`${API_URL}/api/stats`));
  },

  async getQueryPipeline(queryId: string) {
    return j<{ query_id: string; pipeline: PipelineStep[] }>(
      await apiFetch(`${API_URL}/api/query/${queryId}/pipeline`)
    );
  },

  async health() {
    // Public endpoint — no auth required
    return j<any>(await fetch(`${API_URL}/api/health`));
  },
};

/**
 * Streams /api/query/stream token-by-token via SSE over fetch() ReadableStream.
 */
export async function streamQuery(
  payload: {
    query: string;
    strategy: string;
    filters?: MetadataFilters;
    top_k_initial?: number;
    top_k_final?: number;
    semantic_weight?: number;
    bm25_weight?: number;
    compress_context?: boolean;
  },
  handlers: {
    onChunks?: (chunks: ChunkScore[]) => void;
    onToken?: (token: string) => void;
    onDone?: (info: { query_id: string; input_tokens?: number; output_tokens?: number }) => void;
    onError?: (err: Error) => void;
  }
) {
  console.info(`[API] streamQuery: Starting stream. Strategy=${payload.strategy}, Query="${payload.query}"`);
  try {
    const res = await apiFetch(`${API_URL}/api/query/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters: {}, ...payload }),
    });
    if (!res.ok || !res.body) {
      const errMsg = `API error ${res.status}: ${await res.text()}`;
      console.error("[API] streamQuery: Connection failed:", errMsg);
      throw new Error(errMsg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.info("[API] streamQuery: Stream socket closed by remote host.");
        break;
      }
      buffer += decoder.decode(value, { stream: true });

      let sepIndex;
      while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);

        let event = "message";
        const dataLines: string[] = [];
        for (const line of rawEvent.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
        }
        const data = dataLines.join("\n");

        if (event === "chunks") {
          const parsed = JSON.parse(data);
          console.info(`[API] streamQuery: Received chunks metadata. Count=${parsed.length}`);
          handlers.onChunks?.(parsed);
        } else if (event === "token") {
          handlers.onToken?.(data);
        } else if (event === "done") {
          const parsed = JSON.parse(data);
          console.info(`[API] streamQuery: Done. QueryID=${parsed.query_id}, InputTokens=${parsed.input_tokens}, OutputTokens=${parsed.output_tokens}`);
          handlers.onDone?.(parsed);
        }
      }
    }
  } catch (err) {
    console.error("[API] streamQuery: Exception caught:", err);
    const errorObj = err instanceof Error ? err : new Error(String(err));
    handlers.onError?.(errorObj);
    throw errorObj;
  }
}

/**
 * Polls a job-status fetcher until "done" or "failed".
 */
export async function pollJob<T extends { status: string }>(
  fetchJob: () => Promise<T>,
  onUpdate: (job: T) => void,
  intervalMs = 1200
): Promise<T> {
  console.info("[API] pollJob: Started status polling loop.");
  while (true) {
    try {
      const job = await fetchJob();
      console.info(`[API] pollJob: Received poll update. Status=${job.status}`);
      onUpdate(job);
      if (job.status === "done" || job.status === "failed") {
        console.info(`[API] pollJob: Completed polling loop with terminal status=${job.status}`);
        return job;
      }
    } catch (err) {
      console.warn("[API] pollJob: Retrying job status poll due to connection/network drop...", err);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
