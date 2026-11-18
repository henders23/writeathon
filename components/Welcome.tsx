"use client";

import { dismissWelcome } from "@/lib/welcome";

/** Shown each time someone opens the app: what Writeathon is and how to use it, in two sentences. */
export default function Welcome({ name, onStart }: { name?: string; onStart?: () => void }) {
  return (
    <main className="start" aria-labelledby="welcome-h">
      <h1 id="welcome-h" className="start-title">{name ? `Welcome back, ${name}.` : "Welcome to Writeathon."}</h1>
      <p className="lead" style={{ maxWidth: 620, fontSize: 19 }}>
        Writeathon is ten minutes of academic writing practice a day, on topics from your own subject.
        Plan and write one paragraph, get feedback you can use, rewrite one sentence, and take one strategy into your next paragraph.
      </p>
      <button
        className="btn big"
        style={{ minWidth: 220 }}
        autoFocus
        onClick={() => {
          dismissWelcome();
          onStart?.();
        }}
      >
        Let’s get writing!
      </button>
    </main>
  );
}
