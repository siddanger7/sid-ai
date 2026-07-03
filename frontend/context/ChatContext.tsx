"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

import { ChatMessage } from "@/types/chat";
import { Conversation } from "@/types/conversation";

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;

  createConversation: () => void;

  selectConversation: (id: string) => void;

  addMessage: (message: ChatMessage) => void;

  clearConversation: () => void;
}

const ChatContext =
  createContext<ChatContextType | null>(null);

export function ChatProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null);

  function createConversation() {
    const chat: Conversation = {
      id: crypto.randomUUID(),
      title: "New Chat",
      createdAt: new Date().toISOString(),
      messages: [],
    };

    setConversations((prev) => [chat, ...prev]);

    setActiveConversationId(chat.id);
  }

  function selectConversation(id: string) {
    setActiveConversationId(id);
  }

  function addMessage(message: ChatMessage) {
    setConversations((prev) =>
      prev.map((chat) =>
        chat.id === activeConversationId
          ? {
              ...chat,
              messages: [...chat.messages, message],
            }
          : chat
      )
    );
  }

  function clearConversation() {
    setConversations((prev) =>
      prev.map((chat) =>
        chat.id === activeConversationId
          ? {
              ...chat,
              messages: [],
            }
          : chat
      )
    );
  }

  const activeConversation =
    conversations.find(
      (c) => c.id === activeConversationId
    ) ?? null;

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        createConversation,
        selectConversation,
        addMessage,
        clearConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error(
      "useChatContext must be used inside ChatProvider"
    );
  }

  return context;
}