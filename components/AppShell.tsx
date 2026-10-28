"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentStreak } from "@/lib/progress";
import { useAppState } from "@/lib/store";
import DictionaryCapture from "./DictionaryCapture";
import { Close, Flame } from "./Icons";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Today" },
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
  { href: "/bank", label: "Bank" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/group", label: "Group" },
];

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/** The app frame for everyday pages: top bar with navigation. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const state = useAppState();
  const profile = state?.profile;
  const streak = profile && state ? currentStreak(profile, state.sessions) : 0;
  return (
    <div className="app">
      <header className="topbar">
        <Link href="/" className="wordmark">Writeathon</Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="topbar-right">
          {profile && (
            <span className="streak-chip">
              <Flame size={18} color="var(--amber)" /> {streak}-day streak
            </span>
          )}
          <ThemeToggle />
          {profile && (
            <Link href="/profile" className="round-btn avatar" aria-label="Your profile and settings">
              {initials(profile.name)}
            </Link>
          )}
        </div>
      </header>
      {children}
      <DictionaryCapture />
    </div>
  );
}

export const SESSION_STEPS = ["Plan", "Write", "Ask", "Feedback & rewrite"] as const;

/** The focused frame for a writing session: steps instead of navigation. */
export function SessionShell({ step, children, label }: { step: number; children: React.ReactNode; label?: string }) {
  return (
    <div className="app">
      <header className="topbar">
        <Link href="/" className="wordmark">Writeathon</Link>
        <nav className="steps" aria-label="Session steps">
          {SESSION_STEPS.map((s, i) => (
            <span key={s} className={i < step ? "done" : i === step ? "now" : ""} aria-current={i === step ? "step" : undefined}>
              {i < step ? "✓ " : ""}
              {s}
            </span>
          ))}
        </nav>
        <div className="topbar-right">
          {label && <span className="streak-chip">{label}</span>}
          <ThemeToggle />
          <Link href="/" className="round-btn" aria-label="Leave this session">
            <Close />
          </Link>
        </div>
      </header>
      {children}
      <DictionaryCapture />
    </div>
  );
}
