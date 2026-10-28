# Writeathon

*By Paul Hendrie*

Ten minutes of academic writing a day, designed for a laptop. University students plan, write and revise one paragraph on a topic from their own subject, usually responding to a short extract from genuine open-access research. They choose what feedback they want, get notes in the margin of every sentence, rewrite the one sentence that matters most, and watch a detailed picture of their writing grow over time. It's the writing sibling of [Speakathon](https://github.com/henders23/speakathon).

## The pedagogy in one paragraph

Students learn more from planning and revising than from drafting, so the session is built around both. Before writing, the student plans the paragraph's **moves** (what each sentence will do: claim, evidence, concede, so what…) and gets an instant check against the task. After writing, they choose what to ask about and name the sentence they're least sure of, which builds the self-assessment that independent writers need. Feedback is focused: every sentence is labelled with the move it performs, strengths quote the student's own words, and one sentence is chosen for rewriting. Hints step up only as far as they're needed (a clue, then the pattern on a different topic, then a model). The app never rewrites the paragraph for them. Fixed sentences go into a **bank** and come back for spaced retrieval; new words go into a **dictionary** and come back as quizzes. When a student reuses a banked pattern *without being asked*, the app marks it: that unprompted reuse is the evidence that learning has happened.

## The session

| Step | What happens |
|---|---|
| **Choose** | Three topics from the student's subject each day (or two short warm-ups for a new student), plus **Bring your own**: a question from their own module, or an extract they're reading |
| **Plan** | The task is front and centre. The source sits in the left pane with **Help me understand this** (a plain-English summary and key words). The student builds an outline from 12 moves (or asks for a suggested shape) and an outline check flags a missing citation, a weak opening or no "so what" |
| **Write** | Five minutes on a three-pane desk: task and source, the editor, and a live coach that ticks off planned moves sentence by sentence and tracks today's focus. Pasting is off and long copied strings from the source are flagged |
| **Ask** | The student picks the sentence they're least sure of and up to two things to ask about (my main view, linking, citing, sounding academic, grammar…), plus an optional question of their own |
| **Feedback & rewrite** | The paragraph sentence by sentence with move labels and margin notes, answers to their questions, plan vs paragraph, then vs now on a repeated question, a model paragraph to compare with (after rewriting), and the rewrite with stepped hints and banking |

## Feedback on effectiveness, not just correctness

Feedback judges first how well the paragraph **works for its reader**: whether it answers the question, whether each move does its job in a purposeful order, how ideas connect, how sources are used and (with two or three sources) synthesised, and whether claims are as strong as the evidence. Language is judged by its effect on meaning, not by error count. Each paragraph gets an effectiveness profile with an indicative level per criterion, aligned to the CEFR Companion Volume (2020) scales for written production and mediation (thematic development, coherence and cohesion, processing text in writing, synthesising information and arguments from a number of sources, propositional precision, and vocabulary range and grammatical accuracy). Each sentence is labelled with its move and how well it does its job. The progress dashboard tracks the profile over time.

## One, two or three sources

Before planning, students choose how many source extracts to draw on. One source means responding to it. Two or three mean synthesising: relating the sources to each other to make their own point. The plan gains a Synthesise move, the outline check and the live coach track every citation, the word target and writing time grow a little, and synthesis is assessed in the feedback. Students bringing their own material can add up to three extracts.

## Genuine sources

Every source extract in `lib/bank/` is copied word for word from the abstract (or author summary) of a real, peer-reviewed open-access article published under CC BY, CC BY-SA or CC0, which allow reuse with attribution. Each source records the authors, year, title, journal, DOI or URL, licence and section, and the app shows the full reference under the extract. A " … " marks where a sentence has been left out. Some days are deliberately prompt-only. Data on data-task days comes from the article itself. Student-supplied sources ("Bring your own") are labelled as the student's own.

## Dictionary

Students can select a word or short phrase anywhere marked as readable text (sources, tasks, plain-English explanations, feedback, model paragraphs) and choose **Add to my dictionary**. The AI writes a learner's definition for the meaning in that sentence, an example, collocations and quiz distractors. Quizzes follow the same 1, 3, 7, 14, 30-day schedule as the bank and get harder as a word is learned: choose the meaning → fill the gap → recall the word from its meaning → write your own sentence (checked by the AI). A wrong answer brings the word back tomorrow.

## Progress dashboard

Computed entirely from the student's own work: headline numbers; the five areas (Argument, Organisation, Sources, Range, Accuracy) then vs now; strengths and where to grow next, with quotes; writing fluency (words per five minutes); a language snapshot (hedging, sentence length, reporting-verb variety); all 17 focuses across the last 12 paragraphs; which paragraph moves the student uses and how closely they follow their plan; recall of banked sentences by gap; what they ask about; and how often their least-sure sentence matches the tutor's choice. Every chart has a table view.

## Also in the app

- **Practice:** Sentence Surgery (90-second sentence combining), Phrase Hunt on any of today's topics, bank review, dictionary quiz, weekly revision day, bring your own.
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

Optional model overrides: `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`, used for feedback, rewrite checks, revision and game generation) and `ANTHROPIC_FAST_MODEL` (default `claude-haiku-5-5`, used for dictionary definitions, source explanations, word-use checks and Sentence Surgery checks). On Claude, JSON comes back through structured outputs, and the long instructions are prompt-cached.

To demo the dashboard, bank and dictionary without weeks of practice, open the profile (initials, top right) and choose **Load sample history**.

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
| `lib/instructions.ts` | AI instructions and JSON schemas: feedback, rewrite, revision, games, dictionary, explanations |
| `lib/progress.ts`, `lib/insights.ts` | Streaks, topic choice, focus selection, spaced schedules, and everything on the dashboard |
| `app/session` | Plan → Write → Ask (and Phrase Hunt writing) |
| `app/feedback/[id]` + `components/RewriteIt.tsx` | Margin feedback, rewrite with stepped hints, banking |
| `app/own` | Bring your own topic or source |
| `app/dictionary`, `app/dictionary/quiz`, `components/DictionaryCapture.tsx` | Word capture, dictionary and quizzes |
| `app/progress` + `components/Charts.tsx` | The dashboard |
| `app/practice`, `app/review`, `app/revise`, `app/hunt`, `app/surgery` | Practice modes |
| `app/api/*` | Server routes for each AI call |
