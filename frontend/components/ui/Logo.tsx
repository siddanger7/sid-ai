"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { box: "h-7 w-7", icon: 14, text: "text-sm" },
  md: { box: "h-9 w-9", icon: 18, text: "text-lg" },
  lg: { box: "h-14 w-14", icon: 26, text: "text-2xl" },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <motion.div
        className={cn(
          "relative flex items-center justify-center rounded-xl",
          "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600",
          "shadow-[0_0_20px_rgba(99,102,241,0.5)]",
          s.box
        )}
        animate={{
          boxShadow: [
            "0 0 20px rgba(99,102,241,0.5)",
            "0 0 30px rgba(168,85,247,0.6)",
            "0 0 20px rgba(99,102,241,0.5)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles size={s.icon} className="text-white" strokeWidth={2.25} />
        <div className="absolute inset-0 rounded-xl bg-white/10 backdrop-blur-sm" />
      </motion.div>

      {showText && (
        <span
          className={cn(
            "font-semibold tracking-tight text-transparent bg-clip-text",
            "bg-gradient-to-r from-white via-blue-100 to-purple-200",
            s.text
          )}
        >
          sid.ai
        </span>
      )}
    </div>
  );
}