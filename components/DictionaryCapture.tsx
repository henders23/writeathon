"use client";

import { useEffect, useState } from "react";
import { addWord, sentenceAround } from "@/lib/dictionary";
import { useToast } from "@/lib/toast";

type Pop = { x: number; y: number; word: string; context: string; from: string } | null;

/**
 * Select a word or short phrase in any text marked data-dict (sources, prompts, feedback,
 * model paragraphs) and an "Add to my dictionary" button appears above it.
 */
export default function DictionaryCapture() {
  const [pop, setPop] = useState<Pop>(null);
  const message = useToast();

  useEffect(() => {
    function onUp() {
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? "";
        if (!sel || !text || sel.rangeCount === 0 || text.split(/\s+/).length > 4 || text.length > 48) {
          setPop(null);
          return;
        }
        const node = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement;
        const host = node?.closest("[data-dict]") as HTMLElement | null;
        if (!host) {
          setPop(null);
          return;
        }
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        setPop({
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
          word: text,
          context: sentenceAround(host.innerText, text),
          from: host.dataset.dict || "Writeathon",
        });
      }, 0);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPop(null);
    }
    document.addEventListener("mouseup", onUp);
    document.addEventListener("keyup", onUp);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", () => setPop(null), { passive: true });
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("keyup", onUp);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      {pop && (
        <div className="dict-pop" style={{ left: pop.x, top: pop.y }} role="dialog" aria-label="Dictionary">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const p = pop;
              setPop(null);
              window.getSelection()?.removeAllRanges();
              void addWord(p.word, p.context, p.from);
            }}
          >
            + Add “{pop.word}” to my dictionary
          </button>
        </div>
      )}
      {message && (
        <div className="toast" role="status" aria-live="polite">
          {message}
        </div>
      )}
    </>
  );
}
