"use client";

import { useState } from "react";
import { Menu, ChevronDown, Moon, Sun, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const MODELS = ["sid-4 Turbo", "sid-4 Reasoning", "sid-3.5 Fast"];

export function Header({ onToggleSidebar }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);
  const [modelOpen, setModelOpen] = useState(false);
  const [model, setModel] = useState(MODELS[0]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3.5 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu size={19} />
        </button>

        <div className="flex items-center gap-2.5">
          <h1 className="text-[15px] font-semibold tracking-tight text-white">sid.ai</h1>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Online
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setModelOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5",
              "text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.08]"
            )}
          >
            <Cpu size={13} className="text-blue-400" />
            <span className="hidden sm:inline">{model}</span>
            <ChevronDown size={13} className="text-white/40" />
          </button>

          <AnimatePresence>
            {modelOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 w-48 overflow-hidden rounded-xl border border-white/10 bg-black/90 p-1.5 shadow-2xl backdrop-blur-2xl"
              >
                {MODELS.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setModel(m);
                      setModelOpen(false);
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-xs text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white",
                      model === m && "bg-white/[0.06] text-blue-300"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setIsDark((v) => !v)}
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
          title="Theme toggle"
        >
          {isDark ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>
    </header>
  );
}