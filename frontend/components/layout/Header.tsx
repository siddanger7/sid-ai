"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sparkles, Moon, Sun } from "lucide-react";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 bg-background px-8">

      <div>
        <h2 className="text-2xl font-bold text-foreground">
          sid.ai
        </h2>

        <p className="text-sm text-gray-500">
          Intelligent Personal Assistant
        </p>
      </div>

      <div className="flex items-center gap-4">

        <div className="flex items-center gap-2 rounded-full border px-4 py-2">
          <Sparkles size={18} className="text-blue-500" />
          <span>Online</span>
        </div>

        {mounted && (
          <button
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            className="rounded-full border p-3 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>
        )}

      </div>

    </header>
  );
}