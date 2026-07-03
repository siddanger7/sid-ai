"use client";

import Message from "./messages/Message";
import { ChatMessage } from "../../types/chat";

interface Props {
  messages: ChatMessage[];
  loading: boolean;
}

export default function ChatWindow({
  messages,
  loading,
}: Props) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">

        <div className="text-center">

          <div className="mb-8 text-7xl">

            🤖

          </div>

          <h1 className="mb-3 text-6xl font-bold text-white">

            Welcome to sid.ai

          </h1>

          <p className="text-xl text-gray-400">

            How can I help you today?

          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10">

      <div className="mx-auto max-w-5xl">

        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
          />
        ))}

        {loading && (
          <div className="mt-6 animate-pulse text-gray-400">

            🤖 sid.ai is thinking...

          </div>
        )}

      </div>

    </div>
  );
}