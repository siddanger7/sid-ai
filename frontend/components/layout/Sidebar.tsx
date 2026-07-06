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
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Conversation } from "@/types/conversation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  onOpenSettings,
  onLogout,
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const { user } = useAuth();

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
  };

  const initials = user?.username
    ? user.username.charAt(0).toUpperCase()
    : "?";

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[var(--bg-backdrop)]"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col",
          "border-r border-[var(--border)] bg-[var(--bg-elevated)]"
        )}
        style={{ boxShadow: "4px 0 30px rgba(0,0,0,0.4)" }}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <Logo size="md" />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-dim)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={onNewChat}
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
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats..."
              className={cn(
                "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] py-2 pl-9 pr-3",
                "text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-faint)]",
                "outline-none transition-colors focus:border-blue-500/50 focus:bg-[var(--bg-hover)]"
              )}
            />
          </div>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          <p className="px-1.5 pb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-faint)]">
            Recent
          </p>
          <div className="space-y-1">
            {filtered.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-[var(--text-faint)]">
                No conversations found
              </p>
            )}
            {filtered.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectConversation(chat.id)}
                className={cn(
                  "group relative flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left",
                  "transition-colors hover:bg-[var(--bg-hover)]",
                  activeId === chat.id && "bg-[var(--bg-active)]"
                )}
              >
                <MessageSquare
                  size={15}
                  className="mt-0.5 shrink-0 text-[var(--text-dim)] group-hover:text-blue-400"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--text-secondary)]">
                    {chat.title}
                  </p>
                  <p className="truncate text-[11.5px] text-[var(--text-faint)]">
                    New Conversation
                  </p>
                </div>
                <span
                  onClick={(e) => handleDelete(chat.id, e)}
                  className="shrink-0 rounded-md p-1 text-transparent transition-colors hover:bg-[var(--bg-surface)] hover:text-red-400 group-hover:text-[var(--text-faint)]"
                >
                  <Trash2 size={13} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border)] p-3">
          <button
            onClick={onOpenSettings}
            className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-[var(--text-soft)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <Settings size={16} />
            Settings
          </button>

          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[var(--text-secondary)]">
                {user?.username || "User"}
              </p>
              <p className="truncate text-[11px] text-[var(--text-faint)]">
                {user?.email || "Signed in"}
              </p>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="rounded-lg p-1.5 text-[var(--text-dim)] transition-colors hover:bg-[var(--bg-hover)] hover:text-red-400"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
