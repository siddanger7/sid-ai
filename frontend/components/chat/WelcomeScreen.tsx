"use client";

import { motion } from "framer-motion";
import { Code2, Lightbulb, PenLine, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void;
}

const SUGGESTIONS = [
  {
    icon: Code2,
    title: "Debug my code",
    subtitle: "Paste an error and I'll help trace it",
    prompt: "Can you help me debug a function that's returning undefined?",
  },
  {
    icon: Lightbulb,
    title: "Explain a concept",
    subtitle: "Feynman-style, clarity-first",
    prompt: "Explain how an event broker works using a simple analogy.",
  },
  {
    icon: PenLine,
    title: "Draft documentation",
    subtitle: "Client-ready technical writing",
    prompt: "Help me write documentation for a system architecture.",
  },
  {
    icon: Sparkles,
    title: "Brainstorm ideas",
    subtitle: "Explore an open-ended problem",
    prompt: "Give me a few approaches to structure a curriculum framework.",
  },
];

export function WelcomeScreen({ onPromptSelect }: WelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="lg" className="mb-6 justify-center" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-2 text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl"
      >
        What can I help you build today?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-10 text-center text-sm text-white/40"
      >
        Ask anything — I'll do my best to give a clear, useful answer.
      </motion.p>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((item, i) => (
          <motion.button
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
            onClick={() => onPromptSelect(item.prompt)}
            className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left backdrop-blur-xl transition-all hover:border-blue-400/30 hover:bg-white/[0.06] hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-300 transition-colors group-hover:from-blue-500/30 group-hover:to-purple-500/30">
              <item.icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/90">{item.title}</p>
              <p className="mt-0.5 truncate text-xs text-white/40">{item.subtitle}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}