"use client";

import { useState, useCallback, useEffect } from "react";
import { Background } from "@/components/layout/Background";
import { Sidebar } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageInput } from "@/components/input/MessageInput";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { ChatMessage } from "@/types/chat";

export default function Home() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  const {
    messages,
    conversations,
    activeId,
    addMessage,
    createConversation,
    selectConversation,
    deleteConversation,
    clearMessages,
    autoRename,
  } = useConversations();

  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLoginOpen(true);
    }
  }, [isLoading, isAuthenticated]);

  const handleSend = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      let convId = activeId;
      if (!convId) {
        convId = createConversation();
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      const conv = conversations.find((c) => c.id === convId);
      if (conv && conv.messages.length === 0) {
        autoRename(trimmed);
      }

      addMessage(userMsg);
      setIsTyping(true);
      setStreamingContent("");

      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: trimmed });

      let accumulated = "";

      await api.sendMessageStream(
        history,
        (token) => {
          accumulated += token;
          setStreamingContent(accumulated);
        },
        () => {
          const reply: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: accumulated,
            createdAt: Date.now(),
          };
          addMessage(reply);
          setStreamingContent("");
          setIsTyping(false);
        },
        (err) => {
          const errorContent = err.message || "Something went wrong.";
          addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: errorContent,
            createdAt: Date.now(),
          });
          setStreamingContent("");
          setIsTyping(false);
        }
      );
    },
    [activeId, conversations, messages, createConversation, addMessage, autoRename]
  );

  const handleNewChat = useCallback(() => {
    createConversation();
  }, [createConversation]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden text-[var(--text-primary)]">
      <Background />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={logout}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <ChatWindow
              messages={messages}
              isTyping={isTyping}
              streamingContent={streamingContent}
              onPromptSelect={(prompt) => handleSend(prompt)}
            />
          </div>
          <MessageInput
            onSend={handleSend}
            disabled={isTyping && !streamingContent}
          />
        </main>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        closable={isAuthenticated}
      />
    </div>
  );
}
