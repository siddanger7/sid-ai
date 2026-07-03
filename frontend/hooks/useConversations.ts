"use client";

import { useEffect, useState } from "react";
import { Conversation } from "../types/conversation";
import { ChatMessage } from "../types/chat";
const STORAGE_KEY = "sidai-conversations";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] =
  useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setConversations(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(conversations)
    );
  }, [conversations]);

  function newConversation() {
    const chat: Conversation = {
    id: crypto.randomUUID(),
    title: "New Chat",
    createdAt: new Date().toISOString(),
    messages: [],
};

    setConversations((prev) => [chat, ...prev]);
    setActiveConversationId(chat.id);

    return chat.id;
  }

  function deleteConversation(id: string) {
    setConversations((prev) =>
      prev.filter((c) => c.id !== id)
    );
  }

  function renameConversation(
    id: string,
    title: string
  ) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title } : c
      )
    );
  }
  function selectConversation(id: string) {
  setActiveConversationId(id);
}

  function autoRenameConversation(
  id: string,
  firstMessage: string
) {
  const title =
    firstMessage.length > 35
      ? firstMessage.slice(0, 35) + "..."
      : firstMessage;

  renameConversation(id, title);
}

  function saveMessages(
    id: string,
    messages: ChatMessage[]
) {
    setConversations(prev =>
        prev.map(chat =>
            chat.id === id
                ? { ...chat, messages }
                : chat
        )
    );
}

return {
  conversations,
  activeConversationId,
  newConversation,
  deleteConversation,
  renameConversation,
  autoRenameConversation,
  saveMessages,
  selectConversation,
};
}