"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/app/auth/supabase/client";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-[1000] animate-fade-in">
      <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-[16px] p-8 w-full max-w-[400px] relative animate-slide-up" ref={modalRef}>
        <button className="absolute top-4 right-4 bg-none border-none text-[#666] text-base cursor-pointer py-1 px-2 rounded-md transition-[background,color] duration-150 hover:bg-[#1e1e1e] hover:text-white" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="text-[2rem] mb-3">✦</div>
          <h2 className="text-[1.4rem] font-semibold text-[#f0f0f0] m-0 mb-1.5">Welcome to Sketch AI</h2>
          <p className="text-[0.875rem] text-[#888] m-0">
            Sign in to save your diagrams and access all features
          </p>
        </div>

        <div className="h-[1px] bg-[#2a2a2a] my-6" />

        <button className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white text-[#1a1a1a] border-none rounded-[10px] text-[0.95rem] font-medium cursor-pointer transition-[opacity,transform] duration-150 hover:opacity-[0.92] hover:-translate-y-px active:translate-y-0" onClick={handleGoogleSignIn}>
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="text-[0.75rem] text-[#555] text-center mt-5">
          By continuing, you agree to our{" "}
          <a className="text-[#888] underline cursor-pointer" href="#">Terms of Service</a> and{" "}
          <a className="text-[#888] underline cursor-pointer" href="#">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
