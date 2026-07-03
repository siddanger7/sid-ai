"use client";

import { useState } from "react";
import { Background } from "@/components/layout/Background";
import { Sidebar } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageInput } from "@/components/input/MessageInput";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useChat } from "@/hooks/useChat";

export default function Home() {
  const { messages, isTyping, sendMessage, clearChat } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden text-white">
      <Background />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={() => {
          clearChat();
          setSidebarOpen(false);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <ChatWindow
              messages={messages}
              isTyping={isTyping}
              onPromptSelect={(prompt) => sendMessage(prompt)}
            />
          </div>
          <MessageInput onSend={sendMessage} disabled={isTyping} />
        </main>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}