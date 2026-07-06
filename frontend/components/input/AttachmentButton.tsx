"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface AttachmentButtonProps {
  onFilesSelected?: (files: File[]) => void;
}

export function AttachmentButton({ onFilesSelected }: AttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setFileNames((prev) => [...prev, ...files.map((f) => f.name)]);
    onFilesSelected?.(files);
    e.target.value = "";
  };

  const removeFile = (name: string) => {
    setFileNames((prev) => prev.filter((f) => f !== name));
  };

  return (
    <div className="relative flex items-center">
      <input ref={inputRef} type="file" multiple onChange={handleChange} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        title="Attach files"
      >
        <Paperclip size={17} />
      </button>

      <AnimatePresence>
        {fileNames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-11 left-0 flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-modal)] p-2 backdrop-blur-2xl"
          >
            {fileNames.map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 rounded-lg bg-[var(--bg-hover)] px-2.5 py-1.5 text-xs text-[var(--text-soft)]"
              >
                <span className="max-w-[140px] truncate">{name}</span>
                <button onClick={() => removeFile(name)} className="text-[var(--text-dim)] hover:text-red-400">
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