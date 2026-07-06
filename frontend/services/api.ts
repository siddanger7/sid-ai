import { ChatMessage, SendMessageResponse } from "@/types/chat";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8888";

const TIMEOUT_MS = 120_000;

function randomId(): string {
  return (
    Math.random().toString(36).slice(2, 11) +
    Date.now().toString(36)
  );
}

export async function sendMessage(
  message: string
): Promise<SendMessageResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
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

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown");
    throw new Error(`Server error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();

  if (!data || typeof data.response !== "string") {
    throw new Error("Unexpected response format from server");
  }

  const reply: ChatMessage = {
    id: randomId(),
    role: "assistant",
    content: data.response,
    createdAt: Date.now(),
  };

  return { message: reply };
}

export const api = { sendMessage };
