"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/auth/context/AuthContext";
import AuthModal from "../auth/auth";
import Image from "next/image";
import styles from "./navbar.module.css";
import { useRouter } from "next/navigation";

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
            <nav className={styles.navbar}>
            <div

            onClick={() => router.push("/")}
            className={styles.left}>
                    <text
                        className={styles.logoSvgText}
                        x="2" y="96"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    >
                        Sketch.ai
                    </text>



                </div>



                <div className={styles.right}>
                    {loading ? null : user ? (
                        <>


                            <div className={styles.titleWrapper}>
                                {editing ? (
                                    <input
                                        className={styles.titleInput}
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
                                        <span className={styles.title}>{title}</span>
                                        <button
                                            className={styles.editBtn}
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
                            </div>



                            <div className={styles.avatarWrapper} ref={dropdownRef}>
                                <button
                                    className={styles.avatarBtn}
                                    onClick={() => setDropdownOpen((prev) => !prev)}
                                >
                                    {user.user_metadata?.avatar_url ? (
                                        <Image
                                            src={user.user_metadata.avatar_url}
                                            alt="avatar"
                                            width={32}
                                            height={32}
                                            className={styles.avatar}
                                        />
                                    ) : (
                                        <div className={styles.avatarFallback}>
                                            {(user.user_metadata?.full_name ?? user.email ?? "U")[0].toUpperCase()}
                                        </div>
                                    )}
                                </button>

                                {dropdownOpen && (
                                    <div className={styles.dropdown}>
                                        <div className={styles.dropdownUser}>
                                            <span className={styles.dropdownName}>
                                                {user.user_metadata?.full_name ?? "User"}
                                            </span>
                                        </div>

                                        <div className={styles.dropdownDivider} />

                                        <div className={styles.sectionTitle}>Saves</div>

                                        <div className={styles.savesList}>
                                            {savedArts?.length ? (
                                                savedArts.map((art) => (
                                                    <div key={art.id} className={styles.saveItem}>
                                                        <img src={art.thumbnail} className={styles.saveThumb} />
                                                        <div className={styles.saveMeta}>
                                                            <span className={styles.saveTitle}>{art.title}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className={styles.empty}>No saved items</span>
                                            )}
                                        </div>

                                        <div className={styles.dropdownDivider} />

                                        <button
                                            className={styles.dropdownItemDanger}
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
                            className={`${styles.btnOutline} ${styles.btn}`}
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
