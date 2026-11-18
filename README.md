# Writeathon

*By Paul Hendrie*

Ten minutes of academic writing a day, designed for a laptop. University students plan, write and revise one paragraph on a topic from their own subject, usually responding to a short extract from genuine open-access research. They choose what feedback they want, get a short set of comments they can act on, rewrite the one sentence that matters most, and carry one strategy into the next day's paragraph. It's the writing sibling of [Speakathon](https://github.com/henders23/speakathon).

## The pedagogy in one paragraph

Students learn more from planning and revising than from drafting, so the session is built around both. Before writing, the student plans the paragraph's **moves** (what each sentence will do: claim, evidence, concede, so what…) and gets an instant check against the task. After writing, they choose what to ask about and name the sentence they're least sure of, which builds the self-assessment that independent writers need. Feedback is short and built to be used: the tutor says what it understood the paragraph to argue, answers the student's question, names one thing that works, and chooses one sentence for rewriting, explaining the convention behind the comment. Hints step up only as far as they're needed (a clue, then the pattern on a different topic, then a model). The app never rewrites the paragraph for them. Fixed sentences go into a **bank** and come back for spaced retrieval. When a student reuses a banked pattern *without being asked*, the app marks it: that unprompted reuse is the evidence that learning has happened.

## The session

New students see a minimal start screen (“Ten minutes. One paragraph. Every day.”, the three parts of a session, and Start), then a short set-up and a page on how feedback works.

| Step | What happens |
|---|---|
| **Choose** | Three topics from the student's subject each day (or two short warm-ups for a new student), plus **Bring your own**: a question from their own module, or an extract they're reading |
| **Plan** | The task is front and centre. The source sits in the left pane with **Help me understand this** (a plain-English summary and key words). The student builds an outline from 12 moves (or asks for a suggested shape) and gets suggestions (never requirements) such as using the source, a clear opening or a "so what" |
| **Write** | Five minutes on a three-pane desk: task and source, the editor, and a live coach that ticks off planned moves sentence by sentence and tracks today's focus. Pasting is off and long copied strings from the source are flagged |
| **Ask** | The student picks the sentence they're least sure of and up to two things to ask about (my main view, linking, citing, sounding academic, grammar…), plus an optional question of their own |
| **Feedback & rewrite** | One screen: what the tutor understood, whether last time's strategy showed up, answers to their questions, one thing that works, one sentence to rewrite (with stepped hints and banking), one language pattern, and one strategy for next time, which the student restates in their own words. Moves, indicative CEFR levels and a model paragraph sit below, collapsed |

## Feedback built to be used

The feedback design follows the research on what makes feedback effective in higher education: feedback has only happened when a student has understood a comment and done something with it. So the tutor says a few things well instead of annotating everything.

- **What I understood.** One sentence beginning "I read your paragraph as…", so the student can check whether their meaning arrived.
- **Their question, answered first.** A direct answer (yes, partly, not yet, and why), not reassurance.
- **One thing that works**, quoted, with enough explanation to repeat it.
- **One sentence to rewrite.** The comment says what happens for the reader at that point; a second line explains the convention behind it in the terms of the student's discipline and genre, and why readers expect it. The student does the rewriting.
- **At most one language pattern.** Meaning comes first. Rule-governed slips (agreement, verb forms, sentence boundaries) are marked for the student to correct; word-level facts that no rule produces are given. The tutor says what it deliberately left unmarked.
- **One strategy to carry forward**: a routine for the next paragraph, not a comment on this one. The student restates it in their own words. It is shown when they plan and write the next paragraph, and that paragraph's feedback reports whether it was used. The progress page keeps this as a **feedback log**: what the feedback asked for, what the student planned, what happened next time.

Comments are plain and direct, because softened criticism is easily missed by someone reading in an additional language, and praise is about the writing, never the writer. Every quote is checked against the student's text on the server before it is shown.

Each paragraph also gets an indicative level per criterion, aligned to the CEFR Companion Volume (2020) scales for written production and mediation (thematic development, coherence and cohesion, processing text in writing, synthesising information and arguments from a number of sources, propositional precision, and vocabulary range and grammatical accuracy). The levels sit below the comments, collapsed, so that they do not compete with them; the progress dashboard tracks them over time.

## One, two or three sources

Before planning, students choose how many source extracts to draw on. One source means responding to it. Two or three mean synthesising: relating the sources to each other to make their own point. The plan gains a Synthesise move, the plan suggestions and the live coach track every citation, the word target and writing time grow a little, and synthesis is assessed in the feedback. Students bringing their own material can add up to three extracts.

## Genuine sources

Every source extract in `lib/bank/` is copied word for word from the abstract (or author summary) of a real, peer-reviewed open-access article published under CC BY, CC BY-SA or CC0, which allow reuse with attribution. Each source records the authors, year, title, journal, DOI or URL, licence and section, and the app shows the full reference under the extract. A " … " marks where a sentence has been left out. Some days are deliberately prompt-only. Data on data-task days comes from the article itself. Student-supplied sources ("Bring your own") are labelled as the student's own.

## Progress dashboard

Computed entirely from the student's own work: headline numbers; the feedback log (each strategy, the student's plan, and whether it was used next time); the five areas (Argument, Organisation, Sources, Range, Accuracy) then vs now; strengths and where to grow next, with quotes; writing fluency (words per five minutes); a language snapshot (hedging, sentence length, reporting-verb variety); all 17 focuses across the last 12 paragraphs; which paragraph moves the student uses and how closely they follow their plan; recall of banked sentences by gap; what they ask about; and how often their least-sure sentence matches the tutor's choice. Every chart has a table view.

## Also in the app

- **Practice:** Phrase Hunt on any of today's topics, bank review, weekly revision day, bring your own.
- **Weekly revision day:** rework a whole paragraph; the AI sorts each change by level (idea, structure, sentence, word).
- **Streaks with freezes**, a focus that moves on once secured, and a seminar-group leaderboard (**a demo for now**: classmates are examples until accounts exist).
- **Light and dark themes**, switchable from the top bar.

## Where data lives

Everything about a student is stored in their own browser (`localStorage`). There are no accounts yet. Paragraphs, selected words and source extracts are sent to the AI provider you configure (Claude or OpenAI).

## Deploying on Vercel

1. In Vercel, **Add New → Project** and import `henders23/writeathon`. The defaults (Next.js) are right.
2. Under **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY`: your Claude API key. Or set `OPENAI_API_KEY` instead to use OpenAI. If both are set, Claude is used; `AI_PROVIDER=openai` forces OpenAI.
   - `ACCESS_CODE`: strongly recommended before sharing the link.
3. Deploy (redeploy after changing environment variables).

Optional model overrides: `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`, used for feedback, rewrite checks, revision and game generation) and `ANTHROPIC_FAST_MODEL` (default `claude-haiku-5-5`, used for source explanations). On Claude, JSON comes back through structured outputs, and the long instructions are prompt-cached.

To demo the dashboard and bank without weeks of practice, open the profile (initials, top right) and choose **Load sample history**.

## Running locally

```bash
cp .env.example .env.local   # add your ANTHROPIC_API_KEY (or OPENAI_API_KEY)
npm install
npm run dev
```

For offline testing you can point `ANTHROPIC_BASE_URL` (or `OPENAI_BASE_URL`) at a mock API.

## How it fits together

| Path | What it does |
| --- | --- |
| `lib/bank/` | Topics and genuine source extracts, one file per subject, plus `warmups.ts` |
| `lib/content.ts` | The five areas, 17 focuses, task types, paragraph moves and task shapes, feedback requests |
| `lib/coach.ts` | Free in-browser coaching: outline checks, suggested shapes, live focus signals, language measures |
| `lib/instructions.ts` | AI instructions and JSON schemas: feedback, rewrite, revision, Phrase Hunt, explanations |
| `lib/progress.ts`, `lib/insights.ts` | Streaks, topic choice, focus selection, spaced schedules, and everything on the dashboard |
| `app/session` | Plan → Write → Ask (and Phrase Hunt writing) |
| `app/feedback/[id]` + `components/RewriteIt.tsx` | The feedback screen, rewrite with stepped hints, banking, the student's plan for next time |
| `app/own` | Bring your own topic or source |
| `app/progress` + `components/Charts.tsx` | The dashboard |
| `app/practice`, `app/review`, `app/revise`, `app/hunt` | Practice modes |
| `app/api/*` | Server routes for each AI call |
