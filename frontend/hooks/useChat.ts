"use client";

import { useState } from "react";
import { ChatMessage } from "../types/chat";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    // Temporary AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Hello 👋 You said:\n\n"${text}"`,
      };

      setMessages((prev) => [...prev, aiMessage]);

      setLoading(false);
    }, 1000);
  }

  return {
    messages,
    loading,
    sendMessage,
  };
}