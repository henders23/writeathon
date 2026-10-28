"use client";

import AppShell from "@/components/AppShell";
import { HowFeedback } from "@/components/Onboarding";

export default function HowPage() {
  return (
    <AppShell>
      <main className="container">
        <HowFeedback standalone />
      </main>
    </AppShell>
  );
}
