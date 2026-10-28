"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Book, Bookmark } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { ROWS, ROW_IDS } from "@/lib/content";
import { dayKey, parseDay } from "@/lib/dates";
import { dueBankItems, nextReviewLabel, REVIEW_INTERVALS } from "@/lib/progress";
import { useAppState } from "@/lib/store";

function short(d: string) {
  return parseDay(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function BankPage() {
  const state = useAppState();
  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;

  const today = dayKey();
  const items = [...state.bank].reverse();
  const reused = items.filter((b) => b.reused > 0).length;
  const due = dueBankItems(state.bank, today, 99);
  const mastered = items.filter((b) => (b.step ?? 0) >= REVIEW_INTERVALS.length).length;

  return (
    <AppShell>
      <main className="container">
        <div className="row between wrap g16" style={{ alignItems: "flex-end" }}>
          <div className="stack g6">
            <p className="eyebrow">Your sentence bank</p>
            <h1 className="h1">Sentences you’ve fixed</h1>
            <p className="lead">
              {items.length === 0
                ? "Sentences you rewrite and bank will collect here."
                : `${items.length} banked sentence${items.length === 1 ? "" : "s"}${reused ? ` · ${reused} used again in later paragraphs` : ""}`}
            </p>
          </div>
          <div className="row g8 wrap">
            {due.length > 0 && (
              <Link href="/review" className="btn">
                <Bookmark size={18} color="var(--on-ink)" /> Fix {Math.min(3, due.length)} from memory
              </Link>
            )}
            <Link href="/dictionary" className="btn secondary">
              <Book size={18} color="var(--blue)" /> Your dictionary
            </Link>
          </div>
        </div>

        {items.length > 0 && (
          <div className="grid4">
            <div className="card tight"><span className="small">Banked</span><span className="stat">{items.length}</span></div>
            <div className="card tight"><span className="small">Due today</span><span className="stat">{due.length}</span></div>
            <div className="card tight"><span className="small">Used again unprompted</span><span className="stat">{reused}</span></div>
            <div className="card tight"><span className="small">Fixed at the 30-day gap</span><span className="stat">{mastered}</span></div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="card" style={{ maxWidth: 760 }}>
            <p className="body">
              After each paragraph you rewrite one sentence. When your rewrite works, bank it. Banked sentences come back for you to fix
              from memory after 1, 3, 7, 14 and 30 days, and when you use a pattern again without being asked, it’s marked here.
            </p>
            <Link href="/" className="btn small" style={{ alignSelf: "flex-start" }}>Write today’s paragraph</Link>
          </div>
        ) : (
          ROW_IDS.filter((r) => items.some((b) => b.row === r)).map((r) => (
            <section key={r} className="stack g12" aria-labelledby={`bank-${r}`}>
              <h2 id={`bank-${r}`} className="h2" style={{ fontSize: 22 }}>{ROWS[r].label}</h2>
              <div className="grid2">
                {items
                  .filter((b) => b.row === r)
                  .map((b) => (
                    <article key={b.id} className="card">
                      <div className="row between g8">
                        <strong style={{ fontSize: 15 }}>{b.label}</strong>
                        <div className="row g6">
                          {b.reused > 0 && <span className="pill blue">Used again{b.reused > 1 ? ` ×${b.reused}` : ""}</span>}
                          <span className="small">{short(b.date)}</span>
                        </div>
                      </div>
                      <p className="bank-before"><span className="sr-only">Before: </span>{b.before}</p>
                      <p className="bank-after" data-dict="Your bank"><span className="sr-only">After: </span>{b.after}</p>
                      {b.transfer && <p className="small"><strong style={{ color: "var(--ink)" }}>Your own example:</strong> {b.transfer}</p>}
                      <div className="row between wrap g8" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                        <span className="small">{nextReviewLabel(b, today)}</span>
                        {(b.reviews?.length ?? 0) > 0 && (
                          <span className="row g4" aria-label={`Review history: ${b.reviews!.map((x) => (x.ok ? "fixed" : "missed")).join(", ")}`}>
                            {b.reviews!.map((x, i) => (
                              <span
                                key={i}
                                title={`${short(x.date)}: ${x.ok ? "fixed from memory" : "missed"}`}
                                className={x.ok ? "cell-s" : "cell-g"}
                                style={{ display: "inline-block" }}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))
        )}
      </main>
    </AppShell>
  );
}
