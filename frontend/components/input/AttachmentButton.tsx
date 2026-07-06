"use client";

import { useRef, useState } from "react";
import { Paperclip, X, Loader2, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api, UploadResponse } from "@/services/api";

interface UploadItem {
  file: File;
  status: "uploading" | "done" | "error";
  response?: UploadResponse;
  error?: string;
}

interface AttachmentButtonProps {
  disabled?: boolean;
}

export function AttachmentButton({ disabled }: AttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = "";

    for (const file of files) {
      const item: UploadItem = { file, status: "uploading" };
      setItems((prev) => [...prev, item]);
      try {
        const response = await api.uploadFile(file);
        setItems((prev) =>
          prev.map((it) =>
            it.file === file ? { ...it, status: "done" as const, response } : it
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.file === file
              ? { ...it, status: "error" as const, error: (err as Error).message }
              : it
          )
        );
      }
    }
  };

  const removeItem = (file: File) => {
    setItems((prev) => prev.filter((it) => it.file !== file));
  };

  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,.csv"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] disabled:opacity-40"
        title="Attach PDF, text, or markdown files"
      >
        <Paperclip size={17} />
      </button>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-11 left-0 flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-modal)] p-2 backdrop-blur-2xl min-w-[200px]"
          >
            {items.map((item) => (
              <div
                key={item.file.name}
                className="flex items-center gap-2 rounded-lg bg-[var(--bg-hover)] px-2.5 py-1.5 text-xs text-[var(--text-soft)]"
              >
                {item.status === "uploading" && (
                  <Loader2 size={12} className="animate-spin shrink-0 text-blue-400" />
                )}
                {item.status === "done" && (
                  <Check size={12} className="shrink-0 text-green-400" />
                )}
                {item.status === "error" && (
                  <X size={12} className="shrink-0 text-red-400" />
                )}
                <span className="max-w-[140px] truncate flex-1">
                  {item.file.name}
                  {item.status === "done" && item.response && (
                    <span className="ml-1 text-[var(--text-faint)]">
                      ({item.response.chunks_indexed} chunks)
                    </span>
                  )}
                </span>
                <button
                  onClick={() => removeItem(item.file)}
                  className="shrink-0 text-[var(--text-dim)] hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
