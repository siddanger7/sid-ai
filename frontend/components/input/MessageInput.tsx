"use client";

import { useState } from "react";

interface Props {
  onSend: (message: string) => void;
}

export default function MessageInput({ onSend }: Props) {

  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;

    onSend(text);

    setText("");
  }

  return (
    <div className="border-t border-white/10 bg-white/5 p-6 backdrop-blur-xl">

      <div className="mx-auto flex max-w-5xl gap-4">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Message sid.ai..."
          className="flex-1 rounded-xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none"
        />

        <button
          onClick={send}
          className="rounded-xl bg-blue-600 px-8 text-white hover:bg-blue-700"
        >
          Send
        </button>

      </div>

    </div>
  );
}