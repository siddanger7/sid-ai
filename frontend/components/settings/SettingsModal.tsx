"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Palette, Settings, User, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "general" | "profile" | "notifications";

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Palette },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-white/10"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("general");
  const [darkTheme, setDarkTheme] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [suggestions, setSuggestions] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-2xl"
          >
            <div className="w-48 shrink-0 border-r border-white/10 bg-white/[0.02] p-3">
              <div className="mb-4 flex items-center gap-2 px-2 pt-1">
                <Settings size={16} className="text-blue-400" />
                <span className="text-sm font-semibold text-white">Settings</span>
              </div>
              <div className="space-y-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                      tab === t.id
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white"
                        : "text-white/50 hover:bg-white/5 hover:text-white/80"
                    )}
                  >
                    <t.icon size={14} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">
                  {TABS.find((t) => t.id === tab)?.label}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {tab === "general" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                    <div>
                      <p className="text-sm text-white/85">Dark theme</p>
                      <p className="text-xs text-white/35">Optimized for low light</p>
                    </div>
                    <Toggle checked={darkTheme} onChange={setDarkTheme} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                    <div className="flex items-center gap-2">
                      <Volume2 size={15} className="text-white/40" />
                      <div>
                        <p className="text-sm text-white/85">Sound effects</p>
                        <p className="text-xs text-white/35">Play sounds on new messages</p>
                      </div>
                    </div>
                    <Toggle checked={sounds} onChange={setSounds} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                    <div>
                      <p className="text-sm text-white/85">Prompt suggestions</p>
                      <p className="text-xs text-white/35">Show suggestions on welcome screen</p>
                    </div>
                    <Toggle checked={suggestions} onChange={setSuggestions} />
                  </div>
                </div>
              )}

              {tab === "profile" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
                      S
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90">Siddiq</p>
                      <p className="text-xs text-white/35">Chennai, Tamil Nadu, India</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                    <p className="text-sm text-white/85">Plan</p>
                    <p className="text-xs text-white/35">Free Plan — Upgrade for higher limits</p>
                  </div>
                </div>
              )}

              {tab === "notifications" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                    <div>
                      <p className="text-sm text-white/85">Email notifications</p>
                      <p className="text-xs text-white/35">Weekly summaries and updates</p>
                    </div>
                    <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                    <div>
                      <p className="text-sm text-white/85">Push notifications</p>
                      <p className="text-xs text-white/35">Real-time alerts on this device</p>
                    </div>
                    <Toggle checked={pushNotifs} onChange={setPushNotifs} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}