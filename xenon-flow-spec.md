# Xenon — Product Document
### Current state, new UX/UI direction, and the Xenon Flow feature paper

---

## Part 1: Current State of Xenon

### 1.1 What Xenon is

Xenon is an AI-powered study platform for science students preparing for WAEC and JAMB. It generates study notes, quizzes, and exam simulations aligned to the WAEC syllabus (currently covering Physics, Chemistry, and Biology, mapped by class level from JSS1 to SS3).

### 1.2 Traction so far

- 40+ students using the platform
- 42+ notes generated
- 108+ AI replies delivered
- 53+ quizzes generated

### 1.3 Current feature set

- **Notes generation** — AI-generated study notes by subject and topic
- **Quiz generation** — objective quizzes, now with configurable question count, difficulty, and topic/prompt-based generation (e.g. "give me 30 hard WAEC questions on electrolysis")
- **Exam simulation** — full WAEC-style simulation or topic-based simulation, with prompt-based exam creation supported
- **AI chat** — general-purpose doubt solver, separate from notes/quiz
- **Mistakes** — a sidebar destination listing failed quiz questions with AI-generated explanations (currently a flat list, not yet stateful)

### 1.4 Known problems with the current experience

Direct user-reported issues:

- **Repeated questions** — quiz/exam generation does not reliably avoid producing duplicate or near-duplicate questions across sessions.
- **Slow** — generation and navigation feel sluggish, particularly around content generation steps.
- **Scattered** — notes, AI chat, quizzes, and exam simulation are separate, disconnected destinations. A student generates notes, leaves to read them, leaves again to ask AI questions, leaves again to take a quiz. There is no single guided path through a topic.

These three problems are the direct motivation for the redesign described in this document.

---

## Part 2: New UX Practices

### 2.1 Information architecture: collapse from "tools" to "one path"

The current top-level navigation treats Notes, Quiz, Chat, and Exam Simulation as separate, equally-weighted destinations — every one of which is a decision point for the student. The new architecture keeps these as accessible tools, but adds one flagship guided path above them (Xenon Flow, detailed in Part 3) so students who don't want to make five separate decisions per topic don't have to.

New home structure:

- **Hero action** — start or continue a Flow (the primary, highest-weighted action)
- **Standalone tools** — Notes, Quiz, Exam Simulation, Chat, Mistakes (still directly accessible, unchanged in purpose, for students who want a specific output without the guided sequence)
- **Progress/stats** — streak, readiness signals, topics mastered

### 2.2 One screen, one continuous state

Within a Flow, stages (notes → micro-check → quiz → theory → remediation) live on **one screen with internal state**, not as separate page navigations. A persistent, thin progress indicator shows position within the topic (e.g. "Section 2 of 4"). Transitions between stages happen in place (content area updates), not via full page loads. This is the direct structural fix for "scattered."

### 2.3 Designing around perceived and actual speed

- Stream content in as it generates (notes appearing progressively, quiz questions appearing one at a time) rather than blocking on a full generation before showing anything.
- Use skeleton states instead of spinners.
- Precompute ahead of need — begin generating the next stage's content in the background while the student is still engaged with the current stage (e.g. generate the quiz while they're still reading notes).
- Cache generated note content per subject/topic so revisiting doesn't re-trigger generation from scratch.

### 2.4 Inline AI, not a separate destination

Asking AI a question about a specific line of notes should not open a modal or navigate away. The pattern: tap/select text → an inline expansion opens directly below that line, pushing content down, answer appears there, collapses back into the note on close. The student never loses their place.

### 2.5 Remediation framing: progress, not punishment

Being routed back to review after a wrong answer must not feel like failure, especially for exam-stakes learning where students already carry anxiety about WAEC/JAMB outcomes.

- Frame as a scoped, short "quick fix" ("Quick fix: neutralization equations — 2 questions to clear this"), not "back to notes."
- Always scoped to the smallest unit that explains the miss (a subsection), never the whole topic.
- Always optional in the moment — a "Later" option must exist; the gap is saved and resurfaced later, never forced immediately.
- Completion gets a small, proportional confirmation (a checkmark and one line) — not a full-screen celebration, since this repeats often across a syllabus and must stay lightweight rather than fatiguing.

### 2.6 Motivation lives outside the flow, not inside it

Streaks, readiness score, and mastery badges belong on the Home/Progress screens — glanced at before or after a session — not injected mid-flow as interrupting popups. Interrupting focused study to show a badge undercuts the study session; showing it on return to Home rewards the student for finishing without breaking concentration.

### 2.7 Mobile-first constraints

Given the target audience (Nigerian secondary students, majority likely on phones and often on limited data):

- Text-first layouts over heavy imagery
- Aggressive caching of generated content so revisiting a topic doesn't re-fetch
- Lightweight tolerance for weaker connections, particularly for the reading-heavy stages

### 2.8 Borrowing from Duolingo's structure, not its stakes mechanics

What transfers from Duolingo-style flows: a linear, unlockable default path; bite-sized units; immediate feedback per question; no ability to get lost mid-sequence.

What does **not** transfer: punishment mechanics (hearts/lives), and full lock-step rigidity. WAEC/JAMB preparation carries real exam stakes and real content depth — punishing wrong answers the way a casual habit app does is actively harmful for an already-anxious student, and forcing all content into tiny gamified units would trivialize subjects that need sustained reasoning (e.g. theory answers). Students should also be able to jump directly to a topic they know they're weak in (via Progress or Mistakes) without walking a full path from the start.

---

## Part 3: New UI Direction

### 3.1 Visual language

- A clean sans-serif for body content (notes, quiz text, UI labels) for readability, paired with a serif display face for section headlines and hero moments (topic hooks, the "Start/Continue Flow" card) — this contrast is what separates a premium feel from a generic study-app look.
- Retain the existing dark, purple-accented identity already established on the live landing page. Reference material pulled from elsewhere (e.g. light/cream palettes) should inform **type pairing and spacing choices only**, not pull the color story away from what's already shipped and recognized by current users.
- Flat surfaces, no heavy photographic backgrounds behind actual content — readability under real conditions (bright sunlight, budget Android screens) takes priority over decorative imagery.

### 3.2 Dashboard (home screen) layout

```
[Hero card — top billing, largest visual weight]
  Serif headline: "Start a Flow" or "Continue: Acids & bases — 2 of 5 sections"
  Short supporting line: "Pick a topic and let Xenon guide you through it"
  [Start Flow →] / [Continue →]

[Tool list/grid — standalone destinations, smaller weight]
  Notes            — generate standalone notes, no flow
  Quiz             — jump straight to a quiz, no flow
  Exam Simulation  — WAEC-style timed sim
  Mistakes         — outstanding + resolved wrong answers
  Chat             — free-form AI tutor

[Stats strip]
  Streak · Readiness signal · Topics mastered
```

The hero card is the flagship entry point (first thing tapped, highest visual weight) without forcing every use case through it — a student who wants a quick standalone quiz should not be funneled into the guided Flow experience if that isn't what they came for.

### 3.3 Component patterns worth carrying through

- **List rows**: small icon + title + subtitle + trailing status/data — reused for topic lists and the Mistakes list (subject tag, topic name, status trailing).
- **Restrained sidebar/nav**: icon + label, grouped sections, no clutter.
- **Gradient/serif hero cards**: reused for both the dashboard hero and the in-Flow "Hook" stage of each topic.

---

## Part 4: Xenon Flow — Feature Paper

### 4.1 Problem statement

Xenon's current experience treats notes, AI explanation, quizzes, and exam simulation as separate, disconnected tools. A student studying one topic has to generate notes, leave to read them, leave again to ask AI clarifying questions, leave again to take a quiz, with no continuity, no shared state, and no sense of progress specific to that topic. This is the direct cause of the "scattered" feedback from current users.

Xenon Flow restructures this into a single, continuous, guided journey through one topic at a time — notes, AI help, and assessment stitched into one sequence instead of five destinations.

*(Note: full syllabus-level "Journeys" — pre-ordered sequences of topics across an entire subject — are part of the long-term vision but are explicitly out of scope for this phase. This paper covers the single-topic Flow only.)*

### 4.2 The topic flow: stage by stage

**1. Hook** — one or two lines on why the topic matters and where it shows up in WAEC/JAMB, framed with a short serif headline (per the UI direction in Part 3).

**2. Notes, broken into subsections** — shown progressively rather than as one long generated block, so the student reads one digestible section at a time.

**3. Inline AI touchpoint** — the student can tap/highlight any line of notes and get an explanation inline, directly below that line, without leaving the notes screen (see UX section 2.4).

**4. Micro-check** — 2-3 quick questions after each subsection, functioning as a pulse check and light reinforcement rather than a formal quiz.

**5. Full quiz + theory practice** — the real assessment for the topic: an objective quiz plus theory questions marked by the AI answer-checker (see 4.4 for the theory-marking design, once built).

**6. Weak-point remediation** — for any wrong answer, the student is routed to a short, scoped "quick fix" rather than the whole topic (see 4.3).

**7. Mastery + spaced repetition** — once resolved, the topic is marked complete and scheduled for future spaced review rather than treated as a dead end.

### 4.3 Weak-point remediation

**Trigger**: every question is tagged at generation time with a `subsectionId` in addition to `topicId`, so a wrong answer can be traced to the precise chunk of content responsible — not just "this topic," but "this subsection of this topic."

**Loop**:

```
Wrong answer
  → identify subsectionId
  → show short "here's what you missed" explanation inline
  → student chooses: [Review this subsection] or [Try similar questions now]
  → re-quiz that subsection only (2-3 fresh questions)
  → pass → mark subsection resolved, return to results
  → fail again → switch explanation style (simpler language / worked example),
                 or route to AI chat with the missed question pre-loaded,
                 or flag as a persistent weak point
```

The remediation loop is always scoped to the smallest unit that explains the miss — never the whole topic — since forcing a full re-read to fix one gap is what causes students to abandon review.

**Repeat failures** are treated as a signal that the standard explanation isn't landing, not as a signal to repeat the same content. Repeated failure routes to a different explanation style, live AI chat with context pre-loaded, or a persistent flag on the student's dashboard rather than an infinite loop.

### 4.4 Distinguishing real gaps from careless mistakes

*(Flagged for further design — not yet fully specified.)* Not every wrong answer indicates the same thing: a genuine conceptual gap and a careless slip should be treated differently by the remediation system (e.g. a slip might not warrant a full re-quiz loop). This distinction — and how the AI should infer it from patterns like response time, answer proximity, or repeated-vs-one-off errors — is an open design question to resolve before full implementation.

### 4.5 Mistakes: the single home for outstanding gaps

Rather than building a separate remediation queue, Xenon Flow's remediation reuses and upgrades the existing **Mistakes** sidebar feature, which currently stores wrong answers as a flat list with AI explanations.

**Current data shape:**

```
{ question, studentAnswer, correctAnswer, explanation, topic, timestamp }
```

**Required data shape:**

```
{
  question, studentAnswer, correctAnswer, explanation,
  subjectId, topicId, subsectionId,
  status: "outstanding" | "in_review" | "resolved",
  attempts: 1,
  firstMissedAt, lastAttemptedAt, resolvedAt
}
```

The two critical additions:

- **`subsectionId`** — without it, remediation can only scope to a whole topic, recreating the punishing experience the redesign is meant to remove.
- **`status`** — without it, Mistakes is a permanent log with no way to know what's actually been fixed, and no honest "outstanding" count.

**Status transitions:**

```
outstanding → opened (from a Flow's quick-fix card, or directly from the Mistakes tab) → in_review
in_review   → passes re-quiz → resolved
in_review   → fails again → outstanding, attempts + 1
```

This reuses the exact remediation loop in 4.3 — `in_review` is simply the persisted state name for "currently inside the re-quiz loop."

**Two systems, one data source**: the in-Flow "quick fix" card is a shortcut into Mistakes, pre-filtered to the relevant subsection. The standalone Mistakes tab is the batch view, where a student can clear gaps across subjects in one sitting, defaulting to "outstanding" with a toggle for resolved history.

### 4.6 Handling staleness

Outstanding mistakes should not accumulate indefinitely, and should not be hard-deleted. Two triggers archive a mistake rather than a fixed timer:

- **Superseded automatically** — if a student later answers fresh questions on that same subsection correctly (through spaced repetition or revisiting the topic), the old mistake is auto-resolved rather than requiring manual clearing.
- **Exam-date archive** — once a subject's target exam date passes, its outstanding mistakes are archived into history rather than staying live indefinitely.

No arbitrary fixed-duration expiry is used, since that risks archiving gaps a student is still actively working to clear.

### 4.7 Downstream uses of remediation data

Once Mistakes carries status, several planned features become largely a matter of reading this data rather than building new logic:

- **Exam Readiness Score** — approximated by `resolved / (resolved + outstanding)`, weighted by topic importance.
- **Spaced repetition scheduling** — subsections with remediation history are prioritized for earlier review; `resolvedAt` feeds the "review again in N days" schedule. Resolving once is not treated as permanent mastery.
- **Aggregate insight** — across all students, frequently-missed subsections indicate where note-generation prompts themselves may need improvement.

### 4.8 Dashboard integration

Xenon Flow is surfaced as the flagship action on the home dashboard (see Part 3.2), not as a replacement for existing standalone tools:

```
[Hero card]
  "Start a Flow" (no prior session)
  or "Continue: [Topic name] — section X of Y" (resuming)
  [Start/Continue →]
```

Since syllabus-level Journeys are out of scope for this phase, "Start a Flow" is a subject + topic selection (consistent with how notes/quiz generation already prompts for subject and topic), not a pick-from-syllabus-order flow. "Continue" simply resumes the last topic Flow left in progress — there is no cross-topic sequencing yet to drive a "next up" recommendation.

### 4.9 Open questions before implementation

1. How should the system distinguish a careless mistake from a genuine conceptual gap (4.4), and should they be remediated differently?
2. What is the exact criteria/threshold for "superseded" resolution in 4.6 — one correct fresh answer, or a small streak?
3. Should the theory-answer AI checker (semantic marking against a generated marking scheme, partial credit, "improve my answer") ship alongside the first version of Flow, or after, given it's technically the hardest single component in the whole feature set?
