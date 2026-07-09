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

/** Authenticated fetch — merges auth header, timeout, and 401 handling. */
async function apiFetch(input: string, init: RequestInit = {}, timeoutMs = 30000): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, { ...init, headers, signal: controller.signal });
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("rag_token");
      document.cookie = "token=; path=/; max-age=0";
      window.location.href = "/login?expired=1";
      throw new Error("Session expired");
    }
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/** Public fetch with timeout only (no auth, no 401 redirect). */
async function publicFetch(input: string, init: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
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
  token_count?: number;
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
    return j<{ id: string; description: string }[]>(await publicFetch(`${API_URL}/api/strategies`));
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
        }, 60000)
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
        }, 300000)
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
      }, 120000)
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
    return j<any>(await apiFetch(`${API_URL}/api/stats`));
  },

  async getQueryPipeline(queryId: string) {
    return j<{ query_id: string; pipeline: PipelineStep[] }>(
      await apiFetch(`${API_URL}/api/query/${queryId}/pipeline`)
    );
  },

  async health() {
    // Public endpoint — no auth required
    return j<any>(await publicFetch(`${API_URL}/api/health`));
  },

  async verifyOtp(email: string, otp: string) {
    return j<{ message: string }>(
      await publicFetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
    );
  },

  async compareEmbeddings(payload: { text: string; model_a: string; model_b: string }) {
    return j<any>(
      await apiFetch(`${API_URL}/api/embeddings/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
  },

  async me() {
    return j<any>(await apiFetch(`${API_URL}/api/auth/me`));
  },

  async login(email: string, password: string) {
    const res = await apiFetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    return res.json();
  },

  async register(email: string, password: string, full_name: string) {
    const res = await apiFetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }
  },

  async logout() {
    await apiFetch(`${API_URL}/api/auth/logout`, { method: "POST" });
  },

  async forgotPassword(email: string) {
    const res = await apiFetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Failed to send reset email");
    return res.json();
  },

  async resetPassword(token: string, newPassword: string) {
    const res = await apiFetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!res.ok) throw new Error("Password reset failed");
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await apiFetch(`${API_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    if (!res.ok) throw new Error("Password change failed");
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
    onDone?: (info: { query_id: string; input_tokens?: number; output_tokens?: number; latency_ms?: number }) => void;
    onError?: (err: Error) => void;
  }
) {
  console.info(`[API] streamQuery: Starting stream request. Strategy=${payload.strategy}, Query="${payload.query}"`);
  try {
    console.info(`[API] streamQuery: Sending POST request to ${API_URL}/api/query/stream`);
    const res = await apiFetch(`${API_URL}/api/query/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters: {}, ...payload }),
    }, 60000);

    console.info(`[API] streamQuery: Response received. Status=${res.status}, StatusText=${res.statusText}, OK=${res.ok}`);
    if (!res.ok || !res.body) {
      const errMsg = `API error ${res.status}: ${await res.text()}`;
      console.error("[API] streamQuery: Connection failed or empty body:", errMsg);
      throw new Error(errMsg);
    }

    console.info("[API] streamQuery: ReadableStream is present. Getting reader...");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    console.info("[API] streamQuery: Starting stream consumption loop.");
    while (true) {
      const { done, value } = await reader.read();
      console.debug(`[API] streamQuery: reader.read() => done=${done}, valueBytes=${value ? value.length : 0}`);

      if (done) {
        console.info("[API] streamQuery: Stream reader reached EOF (done=true). Flushing remaining buffer...");
        if (buffer.trim()) {
          console.info("[API] streamQuery: Buffer contains unflushed data:", JSON.stringify(buffer));
          let event = "message";
          const dataLines: string[] = [];
          for (const line of buffer.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) {
              let val = line.slice(5);
              if (val.startsWith(" ")) val = val.slice(1);
              dataLines.push(val.replace(/\r$/, ""));
            }
          }
          const data = dataLines.join("\n");
          console.info(`[API] streamQuery: Flushed event='${event}' with data length=${data.length}`);
          if (event === "chunks") {
            try { 
              const parsed = JSON.parse(data);
              console.info(`[API] streamQuery: Triggering onChunks (flush) with ${parsed.length} items`);
              handlers.onChunks?.(parsed); 
            } catch (err) {
              console.error("[API] streamQuery: Failed to parse chunks on flush:", err, "Data:", data);
            }
          } else if (event === "token") {
            console.debug(`[API] streamQuery: Triggering onToken (flush) with: ${JSON.stringify(data)}`);
            handlers.onToken?.(data);
          } else if (event === "done") {
            try { 
              const parsed = JSON.parse(data);
              console.info(`[API] streamQuery: Triggering onDone (flush) with:`, parsed);
              if (parsed.error || parsed.query_id === "error") {
                handlers.onError?.(new Error(parsed.error || "Retrieval/Generation error"));
              } else {
                handlers.onDone?.(parsed); 
              }
            } catch (err) {
              console.error("[API] streamQuery: Failed to parse done info on flush:", err, "Data:", data);
            }
          }
        } else {
          console.info("[API] streamQuery: Buffer was empty on EOF.");
        }
        console.info("[API] streamQuery: Stream socket closed by remote host.");
        break;
      }

      const decodedChunk = decoder.decode(value, { stream: true });
      buffer += decodedChunk;
      console.debug(`[API] streamQuery: Decoded chunk text segment length=${decodedChunk.length}, total buffer length=${buffer.length}`);

      while (true) {
        const sepIndex = buffer.indexOf("\n\n");
        const rSepIndex = buffer.indexOf("\r\n\r\n");
        
        let foundIndex = -1;
        let sepLength = 0;
        
        if (sepIndex !== -1 && (rSepIndex === -1 || sepIndex < rSepIndex)) {
          foundIndex = sepIndex;
          sepLength = 2;
        } else if (rSepIndex !== -1) {
          foundIndex = rSepIndex;
          sepLength = 4;
        }
        
        if (foundIndex === -1) {
          break;
        }

        const rawEvent = buffer.slice(0, foundIndex);
        buffer = buffer.slice(foundIndex + sepLength);
        console.debug(`[API] streamQuery: Found SSE double-newline boundary. Event block length=${rawEvent.length}`);

        let event = "message";
        const dataLines: string[] = [];
        for (const line of rawEvent.split("\n")) {
          if (line.startsWith("event:")) {
            event = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            let val = line.slice(5);
            if (val.startsWith(" ")) val = val.slice(1);
            dataLines.push(val.replace(/\r$/, ""));
          }
        }
        const data = dataLines.join("\n");
        console.debug(`[API] streamQuery: Parsed SSE event='${event}', data length=${data.length}`);

        if (event === "chunks") {
          try {
            const parsed = JSON.parse(data);
            console.info(`[API] streamQuery: Received chunks metadata. Count=${parsed.length}`);
            handlers.onChunks?.(parsed);
          } catch (err) {
            console.error("[API] streamQuery: JSON parse error for chunks event:", err, "Data:", data);
          }
        } else if (event === "token") {
          console.debug(`[API] streamQuery: Received token: ${JSON.stringify(data)}`);
          handlers.onToken?.(data);
        } else if (event === "done") {
          try {
            const parsed = JSON.parse(data);
            console.info(`[API] streamQuery: Received done event. QueryID=${parsed.query_id}, InputTokens=${parsed.input_tokens}, OutputTokens=${parsed.output_tokens}`);
            if (parsed.error || parsed.query_id === "error") {
              handlers.onError?.(new Error(parsed.error || "Retrieval/Generation error"));
            } else {
              handlers.onDone?.(parsed);
            }
          } catch (err) {
            console.error("[API] streamQuery: JSON parse error for done event:", err, "Data:", data);
          }
        } else {
          console.warn(`[API] streamQuery: Unknown event type parsed: '${event}'`);
        }
      }
    }
  } catch (err) {
    console.error("[API] streamQuery: Critical exception caught in streamQuery:", err);
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
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("API error 4")) {
        console.error("[API] pollJob: Permanent error received. Stopping poll.", err);
        throw err;
      }
      console.warn("[API] pollJob: Retrying job status poll due to connection/network drop...", err);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
