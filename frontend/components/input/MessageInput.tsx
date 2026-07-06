"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Mic } from "lucide-react";
import { AttachmentButton } from "@/components/input/AttachmentButton";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  };

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 w-full px-4 pb-5 pt-2 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] p-2",
            "transition-colors focus-within:border-blue-400/40",
            "focus-within:shadow-[0_0_35px_rgba(99,102,241,0.2)]"
          )}
          style={{ boxShadow: "0 0 35px var(--shadow-input)" }}
        >
          <AttachmentButton disabled={disabled} />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message SID.AI..."
            rows={1}
            disabled={disabled}
            className="max-h-[200px] flex-1 resize-none bg-transparent px-1 py-2 text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)] disabled:opacity-50"
          />

          <button
            type="button"
            onClick={() => setIsRecording((v) => !v)}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
              isRecording ? "bg-red-500/20 text-red-400" : "text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
            )}
            title="Voice input"
          >
            <Mic size={17} />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
              value.trim() && !disabled
                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-105"
                : "bg-[var(--bg-hover)] text-[var(--text-very-faint)]"
            )}
          >
            <ArrowUp size={17} strokeWidth={2.5} />
          </button>
        </motion.div>

        <p className="mt-2 text-center text-[11px] text-[var(--text-very-faint)]">
          SID.AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}