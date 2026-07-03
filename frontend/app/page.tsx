"use client";

import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import MessageInput from "../components/input/MessageInput";

import { useChat } from "../hooks/useChat";

export default function Home() {

  const {
    messages,
    loading,
    sendMessage,
  } = useChat();

  return (
    <main className="flex h-screen">

      <Sidebar />

      <section className="flex flex-1 flex-col">

        <Header />

        <ChatWindow
          messages={messages}
          loading={loading}
        />

        <MessageInput
          onSend={sendMessage}
        />

      </section>

    </main>
  );
}