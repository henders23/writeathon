# Writeathon

Ten minutes of academic writing a day. University students write one paragraph on a question from their own subject, get one thing that went well and one sentence to rewrite, and build a growing **pattern** of strengths and areas to develop. It's the writing sibling of [Speakathon](https://github.com/henders23/speakathon).

## The pedagogy in one paragraph

Students learn more from revising than from drafting, so the key moment is the **rewrite**, not the writing. Feedback is focused, not comprehensive: one sentence to fix, preferably on the student's current focus. Hints step up only as far as they're needed (a clue, then the pattern on a different topic, then a model). The app never rewrites the student's paragraph. A sentence that has been fixed goes into the student's **bank**. Banked patterns come back on later days, and when a student uses one again *without being asked*, the app marks it. That unprompted reuse is the app's evidence that learning has happened.

## The 10-minute session

| Time | Step | What happens |
|---|---|---|
| ~1:00 | **Read** | The prompt, a source of about 50 words on most days, how a paragraph of this type works (its moves), and today's focus |
| ~0:30 | **Plan** | Three quick notes: main point, support, so what (optional) |
| 5:00 | **Write** | One paragraph of 100–150 words. Pasting is off, there's a word meter, and the app warns about long strings copied from the source |
| ~1:30 | **Feedback** | The paragraph with highlights: two strengths that quote the student's own words, and one sentence to rewrite |
| ~1:30 | **Rewrite it** | The student edits that sentence, the AI checks it, and the student banks it |

## What's in it

- **Today:** a streak with a 7-day row and streak freezes, the day's prompt for the student's subject, today's focus, and a banked sentence from an earlier day to try again.
- **Prompt bank:** 14 subjects × 12 prompts (`lib/bank/`). Each 12-day cycle has eight days with a source (about 50 words) and four prompt-only days. The cycle mixes nine task types: summarise and respond, compare, take a position, describe and interpret data, explain causes or effects, define and illustrate, apply a concept, answer a counterargument, and problem and solution. Everyone in the same subject gets the same prompt on the same day.
- **Practice sources** are written for the app and credited to fictional authors, so students can practise citing. Data figures are illustrative. The app labels both clearly.
- **Pattern:** five areas that mirror Speakathon's:
  - **Argument:** a clear position, supported and qualified.
  - **Organisation:** topic sentences, linking, and the "so what". This replaces Fluency.
  - **Sources:** paraphrasing, reporting verbs, citing, and keeping the student's voice separate from the source's. This replaces Interaction.
  - **Range:** precise words, noun phrases, academic register.
  - **Accuracy:** sentence boundaries, verb forms, articles.

  There are 17 focus areas in total. A focus is secured when it is used well in two paragraphs in a row on that focus. After that, or after five paragraphs, the app moves to the focus with the most recent gaps. A Sources focus rests on days with no source. The weekly recap shows an earlier sentence beside a recent one, plus **words per 5 minutes**, a fluency figure that rises steadily with daily practice.
- **Bank:** every sentence the student has fixed, before and after, grouped by area, and marked when the student uses it again later.
- **Phrase Hunt:** a game mode. The student studies five target items, which are then hidden. Slots fill in live as the student writes. Each item scores 3 for natural use, 1 for a use that's not quite right, and −1 per hint.
- **Sentence Surgery:** a 90-second sentence-combining warm-up. Three operations join short sentences into one academic sentence using a relative clause, a concession, a noun phrase, and so on.
- **Group:** a seminar-group leaderboard. **This is a demo for now**: the student's own streak is real, but the classmates are examples. Real groups need accounts and a shared database. That would also make possible the planned peer-judging feature: reading two anonymous paragraphs on the same question and choosing the clearer one.

## Where data lives

Everything about a student is stored in their own browser (`localStorage`). There are no accounts yet. Paragraphs are sent to OpenAI to write the feedback.

## Deploying on Vercel

1. In Vercel, **Add New → Project** and import `henders23/writeathon`. The defaults (Next.js) are right.
2. Under **Settings → Environment Variables**, add:
   - `OPENAI_API_KEY`: required.
   - `ACCESS_CODE`: strongly recommended before sharing the link.
3. Deploy.

Optional: `OPENAI_FEEDBACK_MODEL` (default `gpt-6-luna`). All AI calls are text-only, so they cost far less than Speakathon's live voice.

To demo the Pattern, Bank and recap screens without three weeks of practice, open the profile (initials, top right) and choose **Load sample history**.

## Running locally

```bash
cp .env.example .env.local   # add your OPENAI_API_KEY
npm install
npm run dev
```

For offline testing you can point `OPENAI_BASE_URL` at a mock of the Responses API.

## How it fits together

| Path | What it does |
| --- | --- |
| `lib/bank/` | The daily prompts and practice sources, one file per subject |
| `lib/content.ts` | The five areas, the focus areas with example patterns, task types and their moves, session timings, game fallbacks |
| `lib/instructions.ts` | The AI instructions and JSON schemas: feedback, rewrite check, Phrase Hunt, Sentence Surgery |
| `lib/progress.ts` | Streaks, freezes, today's prompt and focus, focus selection, the pattern grid, words per 5 minutes, the weekly recap |
| `app/write` | The Read → Plan → Write session (and Phrase Hunt writing) |
| `app/feedback/[id]` + `components/RewriteIt.tsx` | Feedback, highlighted paragraph, Rewrite it with stepped hints, banking |
| `app/api/feedback` | Turns a paragraph into structured feedback (including reuse of banked patterns) |
| `app/api/rewrite` | Checks a rewritten sentence |
| `app/api/hunt`, `app/api/surgery` | Generate the day's games from the prompt |
