"use client";

import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import TabBar from "@/components/TabBar";
import { ROWS, ROW_IDS } from "@/lib/content";
import { parseDay } from "@/lib/dates";
import { nextReviewLabel } from "@/lib/progress";
import { useAppState } from "@/lib/store";

export default function BankPage() {
  const state = useAppState();
  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;

  const items = [...state.bank].reverse();
  const reused = items.filter((b) => b.reused > 0).length;

  return (
    <main className="shell">
      <div className="page with-tabs">
        <div className="stack gap-4">
          <h1 className="h1">Your bank</h1>
          <p className="small" style={{ fontSize: 14 }}>
            {items.length === 0
              ? "Sentences you rewrite and bank will collect here."
              : `${items.length} banked sentence${items.length === 1 ? "" : "s"}${reused ? ` · ${reused} used again in later paragraphs` : ""}`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="card">
            <p className="body">
              After each paragraph you rewrite one sentence. When your rewrite works, bank it. Banked sentences come back for you to fix
              from memory after 1, 3, 7, 14 and 30 days, and when you use a pattern again without being asked, it&apos;s marked here.
            </p>
          </div>
        ) : (
          ROW_IDS.filter((r) => items.some((b) => b.row === r)).map((r) => (
            <section key={r} className="stack gap-10" aria-labelledby={`bank-${r}`}>
              <h2 id={`bank-${r}`} className="eyebrow" style={{ fontWeight: 600 }}>{ROWS[r].label}</h2>
              {items
                .filter((b) => b.row === r)
                .map((b) => (
                  <div key={b.id} className="card tight bank-item">
                    <div className="row between gap-8">
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{b.label}</span>
                      {b.reused > 0 ? (
                        <span className="pill strength">Used again{b.reused > 1 ? ` ×${b.reused}` : ""}</span>
                      ) : (
                        <span className="small" style={{ fontSize: 12 }}>
                          {parseDay(b.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    <p className="bank-before"><span className="sr-only">Before: </span>{b.before}</p>
                    <p className="bank-after"><span className="sr-only">After: </span>{b.after}</p>
                    {b.transfer && <p className="small"><strong>Your own example:</strong> {b.transfer}</p>}
                    <p className="small" style={{ fontSize: 12 }}>{nextReviewLabel(b)}</p>
                  </div>
                ))}
            </section>
          ))
        )}
      </div>
      <TabBar />
    </main>
  );
}
