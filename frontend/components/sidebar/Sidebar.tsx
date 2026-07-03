"use client";

import {
  Plus,
  MessageSquare,
  Search,
  Settings,
  UserCircle2,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-white/10 bg-[#090b17]/80 backdrop-blur-2xl">

      {/* Logo */}

      <div className="border-b border-white/10 p-6">

        <h1 className="text-3xl font-bold text-white">

          <span className="text-blue-500">sid</span>.ai

        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Personal AI Assistant
        </p>

      </div>

      {/* Search */}

      <div className="p-4">

        <button className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-gray-300 transition hover:bg-white/10">

          <Search size={18} />

          Search chats

        </button>

      </div>

      {/* New Chat */}

      <div className="px-4">

        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">

          <Plus size={18} />

          New Chat

        </button>

      </div>

      {/* Recent */}

      <div className="mt-8 flex-1 px-4">

        <h3 className="mb-3 text-xs uppercase tracking-widest text-gray-500">

          Recent

        </h3>

        <button className="mb-2 flex w-full items-center gap-3 rounded-xl bg-white/5 p-4 text-left transition hover:bg-white/10">

          <MessageSquare size={18} />

          Welcome Chat

        </button>

      </div>

      {/* Bottom */}

      <div className="border-t border-white/10 p-4">

        <button className="mb-2 flex w-full items-center gap-3 rounded-xl p-3 transition hover:bg-white/10">

          <Settings size={18} />

          Settings

        </button>

        <button className="flex w-full items-center gap-3 rounded-xl p-3 transition hover:bg-white/10">

          <UserCircle2 size={22} />

          Siddiq Mohamed

        </button>

      </div>

    </aside>
  );
}