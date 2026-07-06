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
  streamingContent?: string;
  onPromptSelect: (prompt: string) => void;
}

export function ChatWindow({
  messages,
  isTyping,
  streamingContent,
  onPromptSelect,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping, streamingContent]);

  if (messages.length === 0 && !streamingContent) {
    return <WelcomeScreen onPromptSelect={onPromptSelect} />;
  }

  const streamingMessage: ChatMessage | null =
    streamingContent
      ? {
          id: "streaming",
          role: "assistant",
          content: streamingContent,
          createdAt: Date.now(),
        }
      : null;

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-6 overflow-y-auto px-4 py-6 scrollbar-thin sm:px-6">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </AnimatePresence>

      {streamingMessage && <ChatBubble message={streamingMessage} />}

      {isTyping && !streamingContent && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
