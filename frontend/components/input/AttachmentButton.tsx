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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
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
            className="absolute bottom-11 left-0 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/90 p-2 backdrop-blur-2xl"
          >
            {fileNames.map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-white/70"
              >
                <span className="max-w-[140px] truncate">{name}</span>
                <button onClick={() => removeFile(name)} className="text-white/40 hover:text-red-400">
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