"use client";

import { useState, useCallback } from "react";
import { Background } from "@/components/layout/Background";
import { Sidebar } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageInput } from "@/components/input/MessageInput";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useConversations } from "@/hooks/useConversations";
import { api } from "@/services/api";
import { ChatMessage } from "@/types/chat";

export default function Home() {
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

      try {
        const { message: reply } = await api.sendMessage(trimmed);
        addMessage(reply);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Something went wrong.";
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: errorMsg,
          createdAt: Date.now(),
        });
      } finally {
        setIsTyping(false);
      }
    },
    [activeId, conversations, createConversation, addMessage, autoRename]
  );

  const handleNewChat = useCallback(() => {
    createConversation();
  }, [createConversation]);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden text-white">
      <Background />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
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
              onPromptSelect={(prompt) => handleSend(prompt)}
            />
          </div>
          <MessageInput onSend={handleSend} disabled={isTyping} />
        </main>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
