# Xenon Flow — Deliverables & Tracking

## Legend

Status: `⬜ not started` `🔄 in progress` `✅ done` `❌ blocked`

---

## Milestone 1: Data Foundation

Tasks to prepare the database, types, and API layer for Flow.

### 1.1 Schema — Mistakes upgrade

- [x] **1.1.1** Add `mistake_status` enum (`outstanding | in_review | resolved`)
- [x] **1.1.2** Add `subsection_id` text column to `question_attempts`
- [x] **1.1.3** Add `status` column (mistake_status) to `question_attempts`
- [x] **1.1.4** Add `attempts` integer (default 1) to `question_attempts`
- [x] **1.1.5** Add `first_missed_at`, `last_attempted_at`, `resolved_at` timestamps to `question_attempts`
- [x] **1.1.6** Generate + run Drizzle migration

### 1.2 Schema — Flow sessions (per-subsection iteration)

- [x] **1.2.1** Create `flow_sessions` table:
  - `id`, `user_id`, `subject`, `topic`, `status` (in_progress | completed),
  - `current_subsection_index` (int, 0-based, tracks which subsection the user is on),
  - `current_stage` (enum: hook | notes | microcheck | quiz | remediation | mastery),
  - `total_subsections` (int — number of subsections for this topic),
  - `created_at`, `updated_at`, `completed_at`
- [x] **1.2.2** Create `flow_stage_progress` table (one row per completed stage per session):
  - `id`, `session_id`, `stage`, `subsection_index` (int, nullable — null for quiz/remediation/mastery),
  - `completed` (boolean), `data` (json — quiz answers, micro-check results, etc.),
  - `created_at`, `updated_at`
  - Note: each subsection gets 2 rows (notes + microcheck). Quiz/remediation/mastery get 1 row each (subsection_index = null).
- [x] **1.2.3** Generate + run Drizzle migration

### 1.3 Schema — Spaced repetition

- [x] **1.3.1** Create `spaced_review` table:
  - `id`, `user_id`, `subject`, `topic`, `subsection_id`, `review_at` (timestamp),
  - `interval` (int days), `last_reviewed_at`, `created_at`
- [x] **1.3.2** Generate + run Drizzle migration

### 1.4 Types & shared constants

- [x] **1.4.1** Define Flow types in `lib/flows/types.ts`: `FlowSession`, `FlowStage`, `FlowStatus`, `FlowStageProgress`
- [x] **1.4.2** Define Mistakes types: `MistakeStatus`, `MistakeWithSubsection`
- [x] **1.4.3** Define spaced repetition types in `lib/flows/types.ts`
- [x] **1.4.4** Extract `Mistake` type from `mistakes/page.tsx` into shared types file

- [ ] **1.4.5** Define `MistakeCategory` type: `"concept" | "calculation" | "formula" | "reading" | "careless"`

### 1.5 Schema — Mistake category (spec 4.5)

- [x] **1.5.1** Add `mistake_category` enum to DB schema
- [x] **1.5.2** Add `category` column (nullable `mistake_category`) to `question_attempts`
- [x] **1.5.3** Generate + run migration `0005_mistake_category`

---

## Milestone 2: AI Layer

New prompts, generation functions, and API routes for Flow-specific content.

### 2.1 Prompts

- [x] **2.1.1** Add `buildHookPrompt()` — generates 1-2 line "why this topic matters" with WAEC/JAMB context
- [x] **2.1.2** Add `buildSubsectionNotesPrompt()` — generates notes for one subsection at a time (tagged with subsectionId), not the full topic
- [x] **2.1.3** Add `buildMicroCheckPrompt()` — generates 2-3 quick objective questions scoped to a single subsection
- [x] **2.1.4** Update `buildExplanationPrompt()` — accepts `subsectionId` and scopes explanation to subsection content

### 2.2 Generation functions

- [x] **2.2.1** Write `generateHook()` in `lib/ai/flows.ts` — returns hook text for a subject+topic
- [x] **2.2.2** Write `generateSubsectionNotes()` — returns notes content for one subsection, with streaming support
- [x] **2.2.3** Write `generateMicroCheck()` — returns 2-3 questions for a subsection, tags with `subsectionId`
- [x] **2.2.4** Write `precomputeNextStage()` — triggers generation of next stage's content in background while student reads current stage

### 2.3 API routes

- [x] **2.3.1** `POST /api/flows/start` — creates a FlowSession row, returns initial hook content
- [x] **2.3.2** `GET /api/flows/:id` — fetches current FlowSession state (for resume)
- [x] **2.3.3** `POST /api/flows/:id/advance` — transitions to next stage, triggers precomputation
- [x] **2.3.4** `POST /api/flows/:id/submit-microcheck` — submits micro-check answers, returns result + remediation if needed
- [x] **2.3.5** `POST /api/flows/:id/submit-quiz` — submits full quiz, returns score with subsection-tagged wrong answers
- [x] **2.3.6** `POST /api/flows/:id/remediate` — returns subsection-scoped remediation content + fresh questions
- [x] **2.3.7** `PUT /api/mistakes/status` — update mistake status (outstanding → in_review → resolved)
- [x] **2.3.8** `POST /api/mistakes/supersede` — auto-resolve mistakes for subsections where student later answers correctly
- [x] **2.3.9** `GET /api/flows/resume` — returns the latest in-progress FlowSession for the user (null if none)
- [x] **2.3.10** Dedup micro-check questions against full quiz questions within the same Flow — reuse existing word-level similarity logic from `lib/ai/quiz.ts`

---

## Milestone 3: Flow UI — Core Shell

The container, navigation, and state that holds all Flow stages.

### 3.1 Flow router / shell (per-subsection iteration)

- [ ] **3.1.1** Create `app/(app)/flow/page.tsx` — "Start a Flow" landing (pick subject + topic)
- [ ] **3.1.2** Create `app/(app)/flow/[id]/page.tsx` — the main Flow container (one-screen state machine)
- [ ] **3.1.3** Build `FlowShell` component — manages the per-subsection iteration loop:
  - Progress indicator: "Subsection 2 of 4 · Notes" or "Quick check"
  - Alternates notes ↔ microcheck per subsection, then final quiz → remediation → mastery
  - Stage transitions in-place (no page loads), auto-advance on micro-check pass
- [ ] **3.1.4** Build `FlowStageRenderer` — renders the current stage based on `current_stage`, passes `subsectionIndex` to notes/microcheck
- [ ] **3.1.5** Build `SubjectTopicPicker` component — grid/list of subjects, then topics (reuse existing curriculum data)
- [ ] **3.1.6** Hydrate FlowShell from server on page load — restore correct stage + subsection + partial answers from `flow_sessions` + `flow_stage_progress`

### 3.2 Hook stage

- [ ] **3.2.1** Build `HookStage` component — serif headline, 1-2 line hook text, [Continue →] button
- [ ] **3.2.2** Use gradient/serif hero card pattern (per spec 3.3)

### 3.3 Notes stage

- [ ] **3.3.1** Build `NotesStage` component — displays one subsection at a time with progressive reveal
- [ ] **3.3.2** Build subsection navigation (next/previous subsection, or auto-advance)
- [ ] **3.3.3** Build inline skeleton loading while notes are streaming in
- [ ] **3.3.4** Build "Mark subsection read" auto-progression to micro-check

### 3.4 Micro-check stage

- [ ] **3.4.1** Build `MicroCheckStage` component — 2-3 quick questions inline, no separate page
- [ ] **3.4.2** Show correct/incorrect per question immediately (instant feedback per spec 2.8)
- [ ] **3.4.3** Pass/fail gate: all correct → advance; any wrong → route to remediation

### 3.5 Quiz stage

- [ ] **3.5.1** Build `QuizStage` component — objective questions + theory textareas, inline in Flow
- [ ] **3.5.2** Build submit flow: score display, section-by-section results
- [ ] **3.5.3** Tag each wrong answer with `subsectionId` for remediation routing
- [ ] **3.5.4** Persist partial quiz answers to `flow_stage_progress.data` on blur/navigate-away — restore on resume

### 3.6 Remediation stage

- [ ] **3.6.1** Build `RemediationStage` component — shows "Quick fix: [subsection name] — 2 questions to clear this"
- [ ] **3.6.2** Build re-quiz loop (2-3 fresh questions on missed subsection only)
- [ ] **3.6.3** Build alternative explanation display for repeat failures (simpler language)
- [ ] **3.6.4** Build "Route to AI chat" button (pre-loads the missed question as context)
- [ ] **3.6.5** Build "Later" button — marks mistake as outstanding, returns to results

### 3.7 Mastery stage

- [ ] **3.7.1** Build `MasteryStage` component — topic complete, checkmark, one-line confirmation (per spec 2.5)
- [ ] **3.7.2** Schedule first spaced review entry
- [ ] **3.7.3** Build "Return to dashboard" and "Start another topic" CTAs
- [ ] **3.7.4** On Flow completion, write `studyActivity` row (streak tracking)

### 3.8 Inline AI touchpoint

- [ ] **3.8.1** Build `InlineAIButton` — appears on text tap/selection in notes, small icon
- [ ] **3.8.2** Build `InlineExplanation` — expands below the selected line, pushes content down, AI answer appears there
- [ ] **3.8.3** Build collapse behavior — collapses back into note on close, student never loses place
- [ ] **3.8.4** Wire to a new `POST /api/explain/inline` endpoint (uses subsection context for better answers)

### 3.9 Error & retry states

- [ ] **3.9.1** Add error boundary per Flow stage — if AI generation fails, show inline error with [Retry] and [Skip this stage] buttons
- [ ] **3.9.2** On retry, re-trigger generation for current stage only (same subsection)
- [ ] **3.9.3** On skip, advance to next stage (logged as skipped in `flow_stage_progress`)
- [ ] **3.9.4** Handle total failure (all retries exhausted) — offer [Exit to Dashboard] with session saved as-is

---

## Milestone 4: Mistakes Redesign

Upgrade the standalone Mistakes page and wire it to the Flow remediation system.

### 4.1 API

- [x] **4.1.1** Update `GET /api/mistakes` — return new shape (subjectId, topicId, subsectionId, status, attempts, timestamps)
- [x] **4.1.2** Add filtering: `?status=outstanding` — filter by status
- [x] **4.1.3** Add filtering: `?subsectionId=xyz` — for in-Flow quick-fix card (pre-filtered view)

### 4.2 UI — Mistakes page

- [ ] **4.2.1** Redesign list view: group by subject → topic, show status badge per item
- [ ] **4.2.2** Add status filter tabs: "Outstanding" (default), "Resolved", "All"
- [ ] **4.2.3** Add "Review" action button per mistake — opens remediation re-quiz inline
- [ ] **4.2.4** Show attempt count, allow re-requesting explanation
- [ ] **4.2.5** Show `category` badge per mistake (concept/calculation/formula/reading/careless) — color-coded, enables category filter tab

### 4.3 Quick-fix card (in-Flow)

- [ ] **4.3.1** Build `QuickFixCard` component — shown in Flow, pre-filtered to current subsection, shows outstanding count
- [ ] **4.3.2** Card links into the remediation loop (reuses 3.6 components)

---

## Milestone 5: Dashboard Redesign

Home screen gets the Flow hero card and stats strip.

### 5.1 Hero card

- [ ] **5.1.1** Build `FlowHeroCard` — serif headline ("Start a Flow" or "Continue: [topic] — section X of Y"), supporting text, [Start →] / [Continue →] CTA
- [ ] **5.1.2** Wire to API (`GET /api/flows/resume`) to show correct state
- [ ] **5.1.3** Clicking [Start →] navigates to `/flow`; [Continue →] navigates to `/flow/[id]`
- [ ] **5.1.4** Place as top section on dashboard page (highest visual weight, gradient card)

### 5.2 Stats strip

- [ ] **5.2.1** Build `StatsStrip` — Streak · Readiness score · Topics mastered, inline, no card wrappers
- [ ] **5.2.2** Place below hero card, above tool grid

### 5.3 Tool grid

- [ ] **5.3.1** Build compact tool list/grid (Notes, Quiz, Exam, Chat, Mistakes) — smaller visual weight than hero
- [ ] **5.3.2** Mistakes item shows outstanding count badge

### 5.4 Reorganize dashboard layout

- [ ] **5.4.1** New section order: Hero → Stats strip → Tool grid → Topic performance → Accuracy chart → Quick actions (consolidated)
- [ ] **5.4.2** Keep existing analytics cards (accuracy, quiz count, streak) — integrate into stats strip or lower section

### 5.5 Sidebar nav entry

- [ ] **5.5.1** Add "Flow" nav item to sidebar (between Dashboard and Xe AI), with Flow icon
- [ ] **5.5.2** If a Flow is in-progress, show indicator dot and link to `/flow/[id]`; otherwise link to `/flow`

---

## Milestone 6: Performance & UX

Streaming, caching, skeletons — the "fast" part of spec 2.3.

### 6.1 Streaming

- [ ] **6.1.1** Stream note content into `NotesStage` as tokens arrive (progressive reveal per spec 2.3)
- [ ] **6.1.2** Stream quiz questions into `QuizStage` one at a time as they generate
- [ ] **6.1.3** Stream micro-check questions into `MicroCheckStage`

### 6.2 Precomputation

- [ ] **6.2.1** After hook generation, trigger notes generation in background
- [ ] **6.2.2** After notes subsection N, trigger micro-check N in background
- [ ] **6.2.3** After micro-check pass, trigger full quiz generation in background
- [ ] **6.2.4** Cache generated content per subject+topic in `generatedContent` table — check cache before generating

### 6.3 Skeleton states

- [ ] **6.3.1** Build `FlowSkeleton` — placeholder layout matching FlowShell structure (per spec 2.3)
- [ ] **6.3.2** Build `NotesSkeleton` — line placeholder blocks for streaming notes
- [ ] **6.3.3** Build `QuizSkeleton` — question card placeholders

### 6.4 Mobile optimization

- [ ] **6.4.1** Audit Flow UI on 360px viewport (FlowShell, NotesStage, quiz interactions)
- [ ] **6.4.2** Ensure all Flow stages work with touch (no hover-only interactions for inline AI)
- [ ] **6.4.3** Aggressive caching: cache generated Flow content so revisiting a topic doesn't re-fetch
- [ ] **6.4.4** Cache invalidation — invalidate cached Flow content when curriculum updates or user changes classLevel

---

## Milestone 7: Spaced Repetition & Mastery

Post-flow scheduling and review system.

- [ ] **7.1** `POST /api/review/schedule` — creates `spaced_review` entry with computed interval (start at 1 day, double each pass)
- [ ] **7.2** `GET /api/review/due` — returns list of subsections due for review today
- [ ] **7.3** Build `ReviewSession` component — quick re-quiz of due subsections (reuses micro-check UI)
- [ ] **7.4** Build "Review due" indicator on dashboard (chip/tag on hero card or stats strip)
- [ ] **7.5** On correct review answer: advance interval, update `resolved_at`; on wrong: reset interval, route to remediation

---

## Milestone 8: Open Questions & Future

Spec items flagged as open design questions or out-of-scope for initial ship.

### 8.1 Theory answer checker (spec 4.4)

- [ ] **8.1.1** Design: decide whether theory checker ships in Flow v1 or v2
- [ ] **8.1.2** If v1: integrate existing `POST /api/quiz/theory/check` into the Flow quiz stage
- [ ] **8.1.3** If v2: leave theory questions as self-review (student compares against ideal answer) in Flow v1

### 8.2 Careless vs gap distinction (spec 4.4)

- [ ] **8.2.1** Design: define heuristics (response time, answer proximity, one-off vs repeated)
- [ ] **8.2.2** Implement: tag mistakes with `careless: boolean` based on heuristics
- [ ] **8.2.3** Implement: careless mistakes skip full re-quiz loop (just show correct answer + move on)

### 8.3 Supersession criteria (spec 4.6)

- [ ] **8.3.1** Design: decide between single correct answer vs small streak to auto-resolve
- [ ] **8.3.2** Implement: deploy chosen criteria in `POST /api/mistakes/supersede`

### 8.4 Exam Readiness Score (spec 4.7)

- [ ] **8.4.1** Build weighted readiness calculation: `resolved / (resolved + outstanding)` weighted by topic importance
- [ ] **8.4.2** Update `GET /api/analytics/me` to return this score (already has `examReadiness` field)

### 8.5 Aggregate insights (spec 4.7)

- [ ] **8.5.1** Build admin view: frequently-missed subsections across all students
- [ ] **8.5.2** Feed back into note-generation prompt improvement

### 8.6 Syllabus-level Journeys (spec 4.1 note)

- [ ] **8.6.1** Deferred: out of scope for this phase. Revisit after Flow ships.

### 8.7 AI Curriculum Navigator (spec 4.12)

- [ ] **8.7.1** Deferred alongside Journeys. Parked to avoid duplicated prerequisite-sequencing work.

---

## Milestone 9: Revision Surface (spec 4.10)

A separate top-level tab — Revision is backward-looking ("review what you already learned"), Home is forward-looking ("start/continue a topic"). Fed entirely by data Flow, Mistakes, and spaced review already produce.

### 9.1 Data layer

- [ ] **9.1.1** Build `GET /api/revision` — returns aggregated revision data: topics with completed Flows, outstanding mistakes, spaced review due items
- [ ] **9.1.2** Build `GET /api/revision/[topicId]` — returns compressed revision content for a specific topic (generated from existing notes + mistakes)
- [ ] **9.1.3** Ensure spaced_review due items appear in revision data

### 9.2 UI

- [ ] **9.2.1** Create `app/(app)/revision/page.tsx` — Revision tab: list of topics ready for review, grouped by subject, sorted by spaced_review due date
- [ ] **9.2.2** Create `app/(app)/revision/[topicId]/page.tsx` — compressed revision view for one topic, with collapsed sections per subsection
- [ ] **9.2.3** Build condensed layout toggle ("1-page mode" / "cheat sheet" view) — a display variant, not a separate AI generation
- [ ] **9.2.4** Wire mistakes + inline AI explanations into revision view (pre-existing data, just surfaced)

### 9.3 Navigation

- [ ] **9.3.1** Add Revision as a top-level nav tab (proposed: Home / Revision / Progress / Chat — see spec 2.1)
- [ ] **9.3.2** Ensure hero copy on Home stays forward-looking; Revision hero copy is backward-looking

---

## Milestone 10: Flow Replay (spec 4.11)

Every completed Flow session auto-generates a personalized revision package. Packaging layer over existing Flow + Mistakes + inline AI data — not a new generation pipeline.

### 10.1 Data & generation

- [ ] **10.1.1** Define `FlowReplay` shape: `{ sessionId, summary, flashcards, mistakes, inlineExplanations, theoryStruggles, compressedRevision, spacedSubsections }`
- [ ] **10.1.2** Build `generateFlowReplay()` — assembles replay package from existing session data:
  - 1-page summary from `flow_stage_progress` notes data
  - Flashcards from key concepts (AI-generated at replay time or cached)
  - Mistakes from `questionAttempts` joined to this session's `quizSessions`
  - Inline AI explanations from `explain/inline` logs (if logged)
  - Compressed "5-minute revision" — condensed view of notes
  - Subsection IDs scheduled into `spaced_review`
- [ ] **10.1.3** Resolve session boundary open question (spec 4.11): one-sitting vs one-topic boundary for replay assembly

### 10.2 API

- [ ] **10.2.1** `GET /api/flows/[id]/replay` — returns replay package for a completed Flow session
- [ ] **10.2.2** `GET /api/replay` — list all available replays for the user (past completed sessions)

### 10.3 UI

- [ ] **10.3.1** Build `FlowReplayCard` component — used in Revision tab to show a completed session's replay
- [ ] **10.3.2** Build `FlowReplayPage` — full replay view: summary → flashcards → mistakes → explanations → compressed revision
- [ ] **10.3.3** Add "View replay" CTA to Mastery stage (3.7) on Flow completion

---

## Milestone 11: Navigation Restructure (spec 2.1)

Align the app's navigation architecture with the proposed bottom-tab layout.

### 11.1 Layout

- [ ] **11.1.1** Evaluate sidebar → bottom-tab migration: Home / Revision / Progress / Chat (see spec 2.1 rationale)
- [ ] **11.1.2** If sidebar retained as primary nav, add Revision as a sidebar entry
- [ ] **11.1.3** Ensure contextual Chat entry points remain (inline from notes, from mistakes) regardless of nav choice

---

## Summary

| Milestone | Tasks | Area |
|-----------|-------|------|
| M1: Data Foundation | 18 | Schema, types, migrations |
| M2: AI Layer | 18 | Prompts, generation, API routes |
| M3: Flow UI — Core Shell | 36 | Components, stages, inline AI, error states |
| M4: Mistakes Redesign | 10 | API, UI, quick-fix card, category badge |
| M5: Dashboard Redesign | 12 | Hero card, stats, layout, sidebar |
| M6: Performance & UX | 14 | Streaming, precompute, skeletons, caching |
| M7: Spaced Repetition | 5 | Scheduling, review sessions |
| M8: Open Questions | 15 | Design decisions, deferred (incl. Navigator) |
| M9: Revision Surface | 8 | Data, UI, navigation |
| M10: Flow Replay | 8 | Data, API, UI |
| M11: Navigation Restructure | 3 | Layout, tab evaluation |
| **Total** | **147** | |

## First priority — build order

1. **M1.1** (Mistakes schema) + **M1.2** (Flow sessions schema) — foundation
2. **M2.1** (Prompts) + **M2.2** (Generation functions) + **M1.4** (Types)
3. **M3.1** (Flow shell: hydration, per-subsection iteration) + **M3.2** (Hook) + **M3.3** (Notes) — playable path
4. **M2.3** (API routes) in parallel with the stages they serve
5. **M3.9** (Error & retry states) — before going wider
6. **M3.4** (Micro-check) + **M3.5** (Quiz + partial answer persistence) + **M3.6** (Remediation) + **M3.7** (Mastery + studyActivity)
7. **M3.8** (Inline AI touchpoint) + **M5.5** (Sidebar nav)
8. **M4** (Mistakes) + **M5** (Dashboard redesign)
9. **M6** (Performance/streaming/caching) + **M7** (Spaced rep)
10. **M8** (Open questions — iterate)
