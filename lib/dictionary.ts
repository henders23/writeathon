"use client";

import { postJSON } from "./api";
import { addDays, dayKey } from "./dates";
import { DISCIPLINE_LABEL } from "./disciplines";
import { REVIEW_INTERVALS } from "./progress";
import { addDictEntry, getState, newId } from "./store";
import { toast } from "./toast";
import type { DictEntry } from "./types";

type Definition = {
  headword: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  collocations: string[];
  distractors: string[];
  wrongWords: string[];
};

/** Look up a word in context and save it to the student's dictionary. */
export async function addWord(word: string, context: string, from: string) {
  const clean = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").trim();
  if (!clean) return;
  const st = getState();
  if (st.dictionary.some((d) => d.word.toLowerCase() === clean.toLowerCase())) {
    toast(`“${clean}” is already in your dictionary.`);
    return;
  }
  toast(`Adding “${clean}”…`, 8000);
  try {
    const d = await postJSON<Definition>("/api/define", {
      word: clean,
      context: context.slice(0, 600),
      discipline: DISCIPLINE_LABEL[st.profile?.discipline ?? ""] ?? "General academic",
    });
    const today = dayKey();
    const entry: DictEntry = {
      id: newId(),
      word: d.headword || clean,
      partOfSpeech: d.partOfSpeech,
      definition: d.definition,
      example: d.example,
      collocations: d.collocations.slice(0, 4),
      distractors: d.distractors.slice(0, 3),
      wrongWords: d.wrongWords.slice(0, 3),
      context,
      from,
      added: today,
      step: 0,
      due: addDays(today, REVIEW_INTERVALS[0]),
      reviews: [],
    };
    addDictEntry(entry);
    toast(`Added “${entry.word}” to your dictionary: ${entry.definition}`, 5000);
  } catch (e) {
    toast(e instanceof Error ? e.message : "Couldn't add that word just now.");
  }
}

/** The sentence around a selection, used as the word's context. */
export function sentenceAround(text: string, word: string): string {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const hit = sentences.find((s) => s.toLowerCase().includes(word.toLowerCase()));
  return (hit ?? text).trim();
}
