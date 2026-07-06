"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Search,
  MessageSquare,
  Settings,
  X,
  Trash2,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useConversations } from "@/hooks/useConversations";
import { cn, truncate } from "@/lib/utils";



interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({ isOpen, onClose, onNewChat, onOpenSettings }: SidebarProps) {
  const [query, setQuery] = useState("");
  const {
  conversations,
  activeId,
  createConversation,
  deleteConversation,
  selectConversation,
} = useConversations();

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = (
    id: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col",
          "border-r border-white/10 bg-black/60 backdrop-blur-2xl",
          "lg:static lg:z-auto lg:translate-x-0"
        )}
        style={{ boxShadow: "4px 0 30px rgba(0,0,0,0.4)" }}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <Logo size="md" />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={() => {
              createConversation();
              onNewChat();
            }}
            className={cn(
              "group flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5",
              "bg-gradient-to-r from-blue-600/90 to-purple-600/90",
              "text-sm font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]",
              "transition-all hover:shadow-[0_0_28px_rgba(168,85,247,0.5)] active:scale-[0.98]"
            )}
          >
            <PlusCircle size={17} strokeWidth={2.25} />
            New Chat
          </button>
        </div>

        <div className="px-3 pt-4">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats..."
              className={cn(
                "w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3",
                "text-sm text-white/85 placeholder:text-white/30",
                "outline-none transition-colors focus:border-blue-500/50 focus:bg-white/[0.06]"
              )}
            />
          </div>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          <p className="px-1.5 pb-2 text-xs font-medium uppercase tracking-wider text-white/30">
            Recent
          </p>
          <div className="space-y-1">
            {filtered.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-white/30">
                No conversations found
              </p>
            )}
            {filtered.map((chat) => (
              <button
                key={chat.id}
                onClick={() => selectConversation(chat.id)}
                className={cn(
                  "group relative flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left",
                  "transition-colors hover:bg-white/[0.06]",
                  activeId === chat.id && "bg-white/[0.08]"
                )}
              >
                <MessageSquare
                  size={15}
                  className="mt-0.5 shrink-0 text-white/40 group-hover:text-blue-400"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white/85">
                    {chat.title}
                  </p>
                  <p className="truncate text-[11.5px] text-white/35">
                    New Conversation
                  </p>
                </div>
                <span
                  onClick={(e) => handleDelete(chat.id, e)}
                  className="shrink-0 rounded-md p-1 text-white/0 transition-colors hover:bg-white/10 hover:text-red-400 group-hover:text-white/30"
                >
                  <Trash2 size={13} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={onOpenSettings}
            className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Settings size={16} />
            Settings
          </button>
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.06]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-semibold text-white">
              S
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white/85">Siddiq</p>
              <p className="truncate text-[11px] text-white/35">Free Plan</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}