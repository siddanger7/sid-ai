"use client";

import { useCallback, useRef, useState } from "react";
import { ChatMessage } from "@/types/chat";
import { api } from "@/services/api";

function randomId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const abortRef = useRef(false);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: randomId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const { message } = await api.sendMessage(trimmed);
      if (!abortRef.current) {
        setMessages((prev) => [...prev, message]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: randomId(),
          role: "assistant",
          content:
            "Something went wrong while generating a response. Please try again.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat,
  };
}