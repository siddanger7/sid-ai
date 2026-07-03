import { ChatMessage, SendMessageResponse } from "@/types/chat";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8888";

function randomId(): string {
  return (
    Math.random().toString(36).slice(2, 11) +
    Date.now().toString(36)
  );
}

export async function sendMessage(
  message: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to contact sid.ai");
  }

  const data = await response.json();

  const reply: ChatMessage = {
    id: randomId(),
    role: "assistant",
    content: data.response,
    createdAt: Date.now(),
  };

  return {
    message: reply,
  };
}

export const api = {
  sendMessage,
};