import { ChatMessage, SendMessageResponse } from "@/types/chat";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8888";

const TIMEOUT_MS = 120_000;
const MAX_RETRIES = 2;
const TOKEN_KEY = "sidai-token";

function randomId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status < 500) return response;
      if (i === retries) return response;
    } catch (_e) {
      if (i === retries) throw _e;
    }
    if (i < retries) {
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error("All retries exhausted");
}

export async function sendMessage(
  message: string,
  history: { role: string; content: string }[] = []
): Promise<SendMessageResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const body = JSON.stringify({
    messages: [...history, { role: "user", content: message }],
  });

  let response: Response;
  try {
    response = await fetchWithRetry(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const msg =
      err instanceof DOMException && err.name === "AbortError"
        ? "Request timed out. The model took too long to respond."
        : `Network error: ${(err as Error).message}`;
    throw new Error(msg);
  }

  clearTimeout(timeout);

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.reload();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown");
    throw new Error(`Server error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data || typeof data.response !== "string") {
    throw new Error("Unexpected response format from server");
  }

  return {
    message: {
      id: randomId(),
      role: "assistant",
      content: data.response,
      createdAt: Date.now(),
    },
  };
}

export async function sendMessageStream(
  history: { role: string; content: string }[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
  signal?: AbortSignal
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    const response = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ messages: history }),
      signal: combinedSignal,
    });

    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.reload();
      throw new Error("Session expired. Please sign in again.");
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "unknown");
      throw new Error(`Server error ${response.status}: ${text.slice(0, 200)}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.token) onToken(parsed.token);
        } catch {
          // skip malformed frames
        }
      }
    }
    onDone();
  } catch (err) {
    const msg =
      err instanceof DOMException && err.name === "AbortError"
        ? "Request timed out."
        : (err as Error).message;
    onError(new Error(msg));
  } finally {
    clearTimeout(timeout);
  }
}

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      ctrl.abort(s.reason);
      return ctrl.signal;
    }
    s.addEventListener("abort", () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}

export interface UploadResponse {
  id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  chunks_indexed: number;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.reload();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Upload failed (${res.status})`);
  }

  return res.json();
}

export const api = { sendMessage, sendMessageStream, uploadFile };
