"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Palette, Settings, User, Volume2, X } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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
        checked ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-[var(--bg-surface)]"
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

const SETTINGS_KEY = "sidai-settings";

interface StoredSettings {
  sounds: boolean;
  suggestions: boolean;
  emailNotifs: boolean;
  pushNotifs: boolean;
}

function loadSettings(): StoredSettings {
  if (typeof window === "undefined") {
    return { sounds: true, suggestions: true, emailNotifs: false, pushNotifs: true };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as StoredSettings;
  } catch { /* ignore */ }
  return { sounds: true, suggestions: true, emailNotifs: false, pushNotifs: true };
}

function saveSettings(s: StoredSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("general");
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const darkTheme = theme !== "light";
  const [sounds, setSounds] = useState(true);
  const [suggestions, setSuggestions] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);

  useEffect(() => {
    const s = loadSettings();
    setSounds(s.sounds);
    setSuggestions(s.suggestions);
    setEmailNotifs(s.emailNotifs);
    setPushNotifs(s.pushNotifs);
  }, [isOpen]);

  useEffect(() => {
    saveSettings({ sounds, suggestions, emailNotifs, pushNotifs });
  }, [sounds, suggestions, emailNotifs, pushNotifs]);

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
            className="flex w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-modal)] shadow-2xl backdrop-blur-2xl"
          >
            <div className="w-48 shrink-0 border-r border-[var(--border)] bg-[var(--bg-raised)] p-3">
              <div className="mb-4 flex items-center gap-2 px-2 pt-1">
                <Settings size={16} className="text-blue-400" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Settings</span>
              </div>
              <div className="space-y-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                      tab === t.id
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-[var(--text-primary)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
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
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {TABS.find((t) => t.id === tab)?.label}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[var(--text-dim)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                >
                  <X size={16} />
                </button>
              </div>

              {tab === "general" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Dark theme</p>
                      <p className="text-xs text-[var(--text-faint)]">Optimized for low light</p>
                    </div>
                    <Toggle checked={darkTheme} onChange={(v) => setTheme(v ? "dark" : "light")} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5">
                    <div className="flex items-center gap-2">
                      <Volume2 size={15} className="text-[var(--text-dim)]" />
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Sound effects</p>
                        <p className="text-xs text-[var(--text-faint)]">Play sounds on new messages</p>
                      </div>
                    </div>
                    <Toggle checked={sounds} onChange={setSounds} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Prompt suggestions</p>
                      <p className="text-xs text-[var(--text-faint)]">Show suggestions on welcome screen</p>
                    </div>
                    <Toggle checked={suggestions} onChange={setSuggestions} />
                  </div>
                </div>
              )}

              {tab === "profile" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
                      {user ? user.username.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-secondary)]">
                        {user?.username ?? (isAuthenticated ? "User" : "Not signed in")}
                      </p>
                      <p className="text-xs text-[var(--text-faint)]">{user?.email ?? ""}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5">
                    <p className="text-sm text-[var(--text-secondary)]">Plan</p>
                    <p className="text-xs text-[var(--text-faint)]">Free Plan — Upgrade for higher limits</p>
                  </div>
                </div>
              )}

              {tab === "notifications" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Email notifications</p>
                      <p className="text-xs text-[var(--text-faint)]">Weekly summaries and updates</p>
                    </div>
                    <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Push notifications</p>
                      <p className="text-xs text-[var(--text-faint)]">Real-time alerts on this device</p>
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