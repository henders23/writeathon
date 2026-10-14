"use client";

import { useEffect } from "react";
import { requestFeedback } from "@/lib/feedbackRunner";
import type { Session } from "@/lib/types";

/** Kicks off feedback for a paragraph that doesn't have it yet. */
export function useSessionFeedback(session: Session | undefined) {
  const needs = Boolean(session && !session.feedback && !session.feedbackError);
  const id = session?.id;
  useEffect(() => {
    if (needs && id) void requestFeedback(id);
  }, [needs, id]);
}
