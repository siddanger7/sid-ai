"use client";

import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#090b17]/60 px-8 backdrop-blur-xl">

      <div>

        <h2 className="text-2xl font-bold text-white">

          sid.ai

        </h2>

        <p className="text-sm text-gray-400">

          Intelligent Personal Assistant

        </p>

      </div>

      <div className="flex items-center gap-3 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-2">

        <Sparkles
          className="text-blue-400"
          size={18}
        />

        <span className="text-blue-300">

          Online

        </span>

      </div>

    </header>
  );
}