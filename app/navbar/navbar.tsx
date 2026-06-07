"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/auth/context/AuthContext";
import AuthModal from "../auth/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const savedArts = [
    {
        id: "1",
        title: "Abstract Waves",
        thumbnail: "/images/art1.jpg",
    },
];

export default function Navbar() {
    const { user, loading, signOut } = useAuth();
    const [showAuth, setShowAuth] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState("Untitled_Sketch");
    const [tempTitle, setTempTitle] = useState(title);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <>
            <nav className="flex justify-between items-center py-[7px] px-10 bg-[#0b0c0f] text-[#e5e7eb] border-b border-[rgba(255,255,255,0.08)] sticky top-0 z-50">
                <div
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2.5 cursor-pointer">
                    <span className="font-logo text-[25px] font-bold text-white">
                        Sketch.ai
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {!mounted || loading ? (
                        <button
                            className="py-1.5 px-[18px] rounded-[10px] bg-transparent border border-[rgba(255,255,255,0.15)] text-[#e5e7eb] text-sm font-medium cursor-pointer hover:border-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.04)] active:bg-[rgba(255,255,255,0.08)]"
                            onClick={() => setShowAuth(true)}
                        >
                            Get Started
                        </button>
                    ) : user ? (
                        <>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                className="text-white rounded-[10px] cursor-pointer mr-2 h-8 px-4 hover:bg-white hover:text-black transition-colors"
                            >
                                Dashboard
                            </Button>
                            {/* <div className="flex items-center gap-1.5">
                                {editing ? (
                                    <input
                                        className="bg-transparent border border-[#2a2a2a] rounded-md py-1 px-2 text-white text-sm outline-none focus:border-[#555]"
                                        value={tempTitle}
                                        onChange={(e) => setTempTitle(e.target.value)}
                                        onBlur={() => {
                                            setTitle(tempTitle);
                                            setEditing(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                setTitle(tempTitle);
                                                setEditing(false);
                                            }
                                        }}
                                        autoFocus
                                    />
                                ) : (
                                    <>
                                        <span className="text-sm text-[#ddd] font-medium mr-20">{title}</span>
                                        <button
                                            className="bg-transparent border-none cursor-pointer text-[13px] opacity-60 transition-all duration-200 ease-in-out hover:opacity-100 hover:scale-110"
                                            onClick={() => {
                                                setTempTitle(title);
                                                setEditing(true);
                                            }}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M12 20h9" />
                                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div> */}

                            <div className="relative" ref={dropdownRef}>
                                <button
                                    className="bg-none border-none cursor-pointer p-0 rounded-full flex items-center justify-center hover:opacity-85"
                                    onClick={() => setDropdownOpen((prev) => !prev)}
                                >
                                    {user.user_metadata?.avatar_url ? (
                                        <Image
                                            src={user.user_metadata.avatar_url}
                                            alt="avatar"
                                            width={32}
                                            height={32}
                                            className="rounded-full object-cover block"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#2a2a2a] text-[#ccc] text-[0.85rem] font-medium flex items-center justify-center">
                                            {(user.user_metadata?.full_name ?? user.email ?? "U")[0].toUpperCase()}
                                        </div>
                                    )}
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute top-[calc(100%+10px)] right-0 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl min-w-[200px] p-[0.4rem] z-[200] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                                        <div className="flex flex-col gap-0.5 pt-2 px-[0.65rem] pb-[0.6rem]">
                                            <span className="text-[0.875rem] font-medium text-[#e0e0e0]">
                                                {user.user_metadata?.full_name ?? "User"}
                                            </span>
                                        </div>

                                        <div className="h-[1px] bg-[#1f1f1f] my-[0.3rem]" />

                                        <div className="text-[0.7rem] text-[#666] py-[0.4rem] px-[0.7rem] uppercase tracking-[0.08em]">Saves</div>

                                        <div className="max-h-[160px] overflow-y-auto flex flex-col gap-1.5 p-[0.3rem]">
                                            {savedArts?.length ? (
                                                savedArts.map((art) => (
                                                    <div key={art.id} className="flex gap-2.5 items-center p-1.5 rounded-[10px] cursor-pointer transition-all duration-200 ease-in-out hover:bg-[rgba(255,255,255,0.05)]">
                                                        <img src={art.thumbnail} className="w-[42px] h-[42px] rounded-lg object-cover" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.8rem] text-[#ddd]">{art.title}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-[0.75rem] text-[#555] p-2">No saved items</span>
                                            )}
                                        </div>

                                        <div className="h-[1px] bg-[#1f1f1f] my-[0.3rem]" />

                                        <button
                                            className="flex items-center gap-2 w-full p-2 border-none bg-none text-[#ff6b6b] text-[0.85rem] rounded-lg cursor-pointer hover:bg-[rgba(255,0,0,0.1)]"
                                            onClick={() => {
                                                signOut();
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            <SignOutIcon />
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button
                            className="py-1.5 px-[18px] rounded-[10px] bg-transparent border border-[rgba(255,255,255,0.15)] text-[#e5e7eb] text-sm font-medium cursor-pointer hover:border-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.04)] active:bg-[rgba(255,255,255,0.08)]"
                            onClick={() => setShowAuth(true)}
                        >
                            Get Started
                        </button>
                    )}
                </div>
            </nav>

            <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
        </>
    );
}

function SignOutIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}
