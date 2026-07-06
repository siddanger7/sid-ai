"use client";

import { useCallback, useEffect, useState } from "react";
import { Conversation } from "../types/conversation";
import { ChatMessage } from "../types/chat";

const STORAGE_KEY = "sidai-conversations";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0) {
          setActiveId(parsed[0].id);
        }
      }
    } catch {
      // corrupt data — start fresh
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const createConversation = useCallback(() => {
    const chat: Conversation = {
      id: crypto.randomUUID(),
      title: "New Chat",
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [chat, ...prev]);
    setActiveId(chat.id);
    return chat.id;
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (activeId === id && remaining.length > 0) {
        setActiveId(remaining[0].id);
      } else if (remaining.length === 0) {
        setActiveId(null);
      }
      return remaining;
    });
  }, [activeId]);

  const addMessage = useCallback(
    (message: ChatMessage) => {
      if (!activeId) return;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, message] }
            : c
        )
      );
    },
    [activeId]
  );

  const autoRename = useCallback(
    (firstMessage: string) => {
      if (!activeId) return;
      const title =
        firstMessage.length > 35
          ? firstMessage.slice(0, 35) + "..."
          : firstMessage;
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, title } : c))
      );
    },
    [activeId]
  );

  const clearMessages = useCallback(() => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [] } : c
      )
    );
  }, [activeId]);

  return {
    conversations,
    activeConversation,
    activeId,
    messages,
    createConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    autoRename,
    clearMessages,
  };
}
