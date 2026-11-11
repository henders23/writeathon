"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "@/lib/store";
import DictionaryCapture from "./DictionaryCapture";

const NAV = [
  { href: "/", label: "Today", also: [] as string[] },
  { href: "/practice", label: "Practice", also: ["/surgery", "/revise", "/own"] },
  { href: "/progress", label: "Progress", also: ["/pattern"] },
  { href: "/bank", label: "Library", also: ["/dictionary", "/review"] },
];

const LIBRARY = [
  { href: "/bank", label: "Sentence bank" },
  { href: "/dictionary", label: "Dictionary" },
];

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/** The app frame for everyday pages: a short top bar, with one place to look below it. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const state = useAppState();
  const profile = state?.profile;
  const inLibrary = LIBRARY.some((l) => path === l.href);
  return (
    <div className="app">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Writeathon, by Paul Hendrie, home">
          <span className="wordmark">Writeathon</span>
          <span className="byline">By Paul Hendrie</span>
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : [n.href, ...n.also].some((h) => path.startsWith(h));
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="topbar-right">
          {profile && (
            <Link href="/profile" className="round-btn avatar" aria-label="Your profile, group and settings">
              {initials(profile.name)}
            </Link>
          )}
        </div>
      </header>
      {inLibrary && (
        <nav className="subnav" aria-label="Library">
          {LIBRARY.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
      {children}
      <DictionaryCapture />
    </div>
  );
}

export const SESSION_STEPS = ["Plan", "Write", "Ask", "Feedback and rewrite"] as const;

/** The focused frame for a writing session: where you are in the four steps, and a way out. */
export function SessionShell({ step, children }: { step: number; children: React.ReactNode; label?: string }) {
  return (
    <div className="app">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Writeathon, by Paul Hendrie, home">
          <span className="wordmark">Writeathon</span>
          <span className="byline">By Paul Hendrie</span>
        </Link>
        <div className="step-now" role="group" aria-label="Session progress">
          <span>
            Step {step + 1} of {SESSION_STEPS.length} · {SESSION_STEPS[step]}
          </span>
          <span className="step-bar" aria-hidden="true">
            {SESSION_STEPS.map((s, i) => (
              <span key={s} className={i <= step ? "on" : ""} />
            ))}
          </span>
        </div>
        <div className="topbar-right">
          <Link href="/" className="text-btn" style={{ padding: "12px 0" }}>
            Leave
          </Link>
        </div>
      </header>
      {children}
      <DictionaryCapture />
    </div>
  );
}
