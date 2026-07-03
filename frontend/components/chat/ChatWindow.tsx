"use client";

import Message from "./messages/Message";
import { ChatMessage } from "../../types/chat";

interface Props {
  messages: ChatMessage[];
  loading: boolean;
}

export default function ChatWindow({ messages, loading }: Props) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">

          <h1 className="mb-5 text-6xl font-bold">
            sid.ai
          </h1>

          <p className="mb-8 text-gray-400">
            Intelligent • Fast • Reliable
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-10 py-8 backdrop-blur-xl">
            <h2 className="mb-3 text-xl font-semibold">
              Welcome 👋
            </h2>

            <p className="text-gray-400">
              Ask me anything...
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">

      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
        />
      ))}

      {loading && (
        <div className="text-gray-400 animate-pulse">
          sid.ai is thinking...
        </div>
      )}

    </div>
  );
}