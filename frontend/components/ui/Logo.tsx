"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const ASPECT = 1536 / 1024;
const sizeMap = {
  sm: { h: 22, w: Math.round(22 * ASPECT), text: "text-sm" },
  md: { h: 30, w: Math.round(30 * ASPECT), text: "text-lg" },
  lg: { h: 44, w: Math.round(44 * ASPECT), text: "text-2xl" },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/sid-ai-logo-v2.png"
        alt="SID.AI"
        width={s.w}
        height={s.h}
        className="shrink-0"
        placeholder="empty"
      />
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight text-[var(--text-primary)]",
            s.text
          )}
        >
          SID.AI
        </span>
      )}
    </div>
  );
}