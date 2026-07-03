"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types/chat";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";

interface ChatWindowProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onPromptSelect: (prompt: string) => void;
}

export function ChatWindow({ messages, isTyping, onPromptSelect }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  if (messages.length === 0) {
    return <WelcomeScreen onPromptSelect={onPromptSelect} />;
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-6 overflow-y-auto px-4 py-6 scrollbar-thin sm:px-6">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </AnimatePresence>

      {isTyping && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}