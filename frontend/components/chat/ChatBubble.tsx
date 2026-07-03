"use client";

import { useState, Fragment } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Sparkles, User } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { cn, formatTime } from "@/lib/utils";

interface ChatBubbleProps {
  message: ChatMessage;
}

interface ParsedBlock {
  type: "code" | "text";
  content: string;
  language?: string;
}

function parseContent(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: "code",
      language: match[1] || "text",
      content: match[2].replace(/\n$/, ""),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: "text", content: content.slice(lastIndex) });
  }

  return blocks;
}

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-blue-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

function TextBlock({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (/^\s*[-*]\s+/.test(line)) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
              <p className="leading-relaxed">
                {renderInline(line.replace(/^\s*[-*]\s+/, ""), `l-${i}`)}
              </p>
            </div>
          );
        }
        if (/^\s*\d+\.\s+/.test(line)) {
          const num = line.match(/^\s*(\d+)\./)?.[1];
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-0.5 shrink-0 text-xs font-semibold text-blue-400">
                {num}.
              </span>
              <p className="leading-relaxed">
                {renderInline(line.replace(/^\s*\d+\.\s+/, ""), `n-${i}`)}
              </p>
            </div>
          );
        }
        return (
          <p key={i} className="leading-relaxed">
            {renderInline(line, `p-${i}`)}
          </p>
        );
      })}
    </div>
  );
}

function CodeBlock({ language, content }: { language: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-white/10 bg-black/60">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3.5 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-blue-100/90">{content}</code>
      </pre>
    </div>
  );
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const blocks = parseContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("flex gap-3 px-1", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-white/10"
            : "bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
        )}
      >
        {isUser ? (
          <User size={14} className="text-white/80" />
        ) : (
          <Sparkles size={14} className="text-white" />
        )}
      </div>

      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-[14px] text-white/90 backdrop-blur-xl",
            isUser
              ? "rounded-tr-sm bg-gradient-to-br from-blue-600/80 to-purple-600/70 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              : "rounded-tl-sm border border-white/10 bg-white/[0.04]"
          )}
        >
          {blocks.map((block, i) =>
            block.type === "code" ? (
              <CodeBlock key={i} language={block.language ?? "text"} content={block.content} />
            ) : (
              <TextBlock key={i} content={block.content} />
            )
          )}
        </div>
        <span className="px-1 text-[11px] text-white/25">{formatTime(message.createdAt)}</span>
      </div>
    </motion.div>
  );
}