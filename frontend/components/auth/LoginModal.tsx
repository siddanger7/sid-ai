"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const GOOGLE_CLIENT_ID = "122309050269-9hroq2jnfueg1v889gvgnaurnsfueimk.apps.googleusercontent.com";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  closable?: boolean;
}

export function LoginModal({ isOpen, onClose, closable = true }: LoginModalProps) {
  const { googleLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const inited = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    inited.current = false;

    const loadGSI = () => {
      if ((window as any).google?.accounts?.id) {
        initGSI();
        return;
      }
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = initGSI;
      document.head.appendChild(s);
    };

    const initGSI = () => {
      if (inited.current || !btnRef.current) return;
      inited.current = true;
      const gsi = (window as any).google.accounts.id;
      gsi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          if (response?.credential) {
            setError(null);
            try {
              await googleLogin(response.credential);
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Google sign-in failed");
            }
          }
        },
      });
      gsi.renderButton(btnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 320,
      });
    };

    const t = setTimeout(loadGSI, 100);
    return () => clearTimeout(t);
  }, [isOpen, googleLogin, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closable ? onClose : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 shadow-2xl text-center"
          >
            {closable && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-[var(--text-dim)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <X size={18} />
              </button>
            )}

            <div className="mb-2 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles size={24} className="text-white" />
              </div>
            </div>

            <h2 className="mb-1 text-xl font-bold text-[var(--text-primary)]">Welcome to SID.AI</h2>
            <p className="mb-6 text-sm text-[var(--text-dim)]">Sign in to start chatting</p>

            {error && (
              <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            <div ref={btnRef} className="flex justify-center" />

            <p className="mt-4 text-[10px] text-[var(--text-faint)]">
              By signing in, you agree to our Terms of Service
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
