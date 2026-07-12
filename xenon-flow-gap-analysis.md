# Xenon Flow — Gap Analysis
### Comparing the shipped implementation against the Xenon Flow spec

This document reviews the "What We've Built" implementation summary against `xenon-flow-spec.md` and flags where the build diverges from, falls short of, or goes beyond what was specced. Nothing here implies the build is wrong — some divergences are good improvisation. The point is to make each gap a deliberate decision rather than an accidental one.

---

## Gap 1: Mistakes is not yet the single source of truth for remediation

### What the spec says (4.5)

Remediation and the standalone Mistakes tab should be **"two systems, one data source."** Every wrong answer — wherever it happens (micro-check, quiz, theory, exam sim) — should land in the Mistakes table with:

```
{
  question, studentAnswer, correctAnswer, explanation,
  subjectId, topicId, subsectionId,
  status: "outstanding" | "in_review" | "resolved",
  category: "concept" | "calculation" | "formula" | "reading" | "careless",
  attempts, firstMissedAt, lastAttemptedAt, resolvedAt
}
```

The in-Flow "quick fix" card is meant to be a shortcut *into* this same data, pre-filtered to the relevant subsection — not a parallel mechanism.

### What's built

The current pipeline is self-contained inside the Flow session:

```
submit-quiz API saves wrongSubsectionIds
  → advance route reads wrongSubsectionIds
  → routes to remediation (if any wrong) or mastery (if all correct)
  → remediation walks each wrong subsectionId in-session
  → advances to mastery
```

There's no indication `wrongSubsectionIds` are being written into a Mistakes table with `status`, `category`, or the resolution lifecycle. Remediation appears to work entirely off the Flow session's own state.

### Why this matters

- **The standalone Mistakes tab (sidebar link exists) is likely still showing the old flat-list data model** — meaning a mistake made inside a Flow session and a mistake made from a standalone quiz are tracked in two different places, with two different shapes. This is the exact duplication the spec was written to avoid.
- **Downstream features can't be built on top of this yet.** Exam Readiness Score (`resolved / (resolved + outstanding)`), spaced repetition prioritization, and Flow Replay's "every mistake made during that session, linked into the Mistakes system" all assume Mistakes has state. Right now there's nothing to link to.
- **"Later" (deferring remediation) may not be possible.** The spec requires an option to skip a quick-fix now and have it resurface later (2.5). If wrongSubsectionIds only exist inside the current Flow session's state, there's no persistent record to resurface once the session ends.

### Recommended fix

1. When `submit-quiz` identifies `wrongSubsectionIds`, write a row per wrong answer into a Mistakes table with `status: "outstanding"` and the subsection/topic/subject tags — in addition to (not instead of) whatever session-local state drives the immediate remediation walk.
2. When remediation's re-quiz on a subsection passes, update that row to `resolved`; on repeat failure, increment `attempts` and keep `status: "outstanding"`.
3. Point the sidebar Mistakes page at this same table, filtered by student, defaulting to `outstanding`.
4. Confirm whether `category` is being set at all yet — if not, this is a good moment to decide whether it's inferred immediately (AI comparing correct vs. given answer at marking time) or backfilled later.

---

## Gap 2: Two different "duplicate" bugs, only one appears fixed

### What the spec/user complaint says

The original reported issue was **repeated quiz questions across sessions** — regenerating a quiz on the same topic produces duplicate or near-duplicate questions.

### What's built

The `dedupe()` helper fixes **subtopic duplication in curriculum fetching** — i.e., the topic/subtopic *list itself* was showing duplicate entries in 5 places. This is a real bug and a real fix, but it's a different bug from the one reported.

### Why this matters

If this gets marked as "fixed the repeated questions issue" in tracking, the actual user complaint remains open. Someone regenerating a quiz on "Electrolysis" for the third time may still get near-identical questions to their first attempt — nothing in what's described touches question-level generation or storage.

### Recommended fix

Treat these as two separate backlog items:

- ✅ **Subtopic list duplication** — fixed by `dedupe()`.
- ⬜ **Quiz question repetition across regenerations** — still needs a generated-question ledger: store a hash or embedding of every question generated per student per topic/subsection, and either filter them out of the AI's context on regeneration or instruct the generation prompt to avoid semantic overlap with a supplied list of prior questions. Exact-text matching alone won't catch AI-rephrased duplicates, so this likely needs a semantic similarity check, not just a string hash.

---

## Gap 3: Prefetching not yet implemented — auto-generation is on-mount, not ahead-of-need

### What the spec says (2.3)

> Precompute ahead of need — begin generating the next stage's content in the background while the student is still engaged with the current stage (e.g. generate the quiz while they're still reading notes).

This was one of three concrete tactics (streaming, skeletons, precomputing) specifically aimed at fixing the "slow" complaint.

### What's built

Each stage (notes, micro-check, quiz) generates **on mount** via `useEffect` when it has no existing content — meaning generation for a stage starts only once the student has already navigated into it. Shimmer states cover the wait, but the wait itself hasn't been moved earlier.

### Why this matters

Shimmer loading improves *perceived* smoothness (no jarring blank screen) but doesn't reduce actual wait time the way prefetching would. The student still hits a real generation delay at the start of quiz, right after finishing notes — the two aren't overlapping.

### Recommended fix

- Trigger quiz generation as a background call once the student reaches, say, the last subsection of notes (or once micro-check for the final subsection is submitted) — not when they land on the quiz screen.
- Cache the result client- or server-side so that if generation finishes before the student arrives, the quiz stage mounts with content already present and no shimmer at all; if they arrive early, they see the (now shorter) remaining wait.
- Same pattern applies to remediation content — if wrong subsections are already known at quiz-submit time, the remediation explanations/retry questions could begin generating during the results-reveal moment rather than after the student taps into remediation.

---

## Gap 4: InlineExplainer is a popup, not push-down-in-place

### What the spec says (2.4)

> Tap/select text → an inline expansion opens directly below that line, pushing content down, answer appears there, collapses back into the note on close. The student never loses their place.

The explicit reasoning was to avoid recreating the "scattered" problem inside the fix — a modal is a context switch away from the note, even if it's small.

### What's built

`InlineExplainer` — text selection triggers an "Explain this" popup, which fetches and displays the explanation.

### Why this matters

A popup (especially if it's a modal/overlay rather than an inline reflow) sits *on top of* the note rather than *within* it. Depending on implementation this may be a minor deviation (a small anchored tooltip near the selection is close enough to spirit) or a more significant one (a full modal that requires dismissing before reading continues). Worth clarifying which this is.

### Recommended fix

Not necessarily a rebuild — first confirm what kind of "popup" this is:

- If it's a small anchored callout near the selected text that doesn't obscure the rest of the note: likely fine, low priority.
- If it's a centered modal/dialog that blocks the note underneath: worth revisiting to match the push-down pattern, since that's the specific mechanism meant to prevent the student from losing their place.

---

## Gap 5: "My Journeys" exists in navigation ahead of the feature being in scope

### What the spec says (4.1, 4.8)

Syllabus-level Journeys (pre-ordered sequences of topics across a full subject) were **explicitly deferred** — this phase covers the single-topic Flow only, with "Start a Flow" as a subject + topic picker rather than a syllabus-ordered sequence.

### What's built

The sidebar restructuring lists **"My Journeys"** as a live item under the Learn section, alongside My Flow, My Streak, and Mistakes.

### Why this matters

This isn't necessarily wrong, but it's worth confirming intent — three possibilities:

1. It's a placeholder link ahead of the UI work, pointing nowhere functional yet.
2. It's meant to eventually house Journeys once built, and is just early scaffolding.
3. Journeys functionality quietly got pulled back into scope without updating the spec.

If it's (3), the spec should be updated to reflect that Journeys are active again, since several other decisions (dashboard hero copy in 4.8, "Continue" behavior with no cross-topic sequencing) were explicitly written assuming Journeys were out of scope.

### Recommended fix

Confirm which of the three above is true. If Journeys are still deferred, either remove the nav item until there's something behind it, or clearly mark it (e.g. a "Coming soon" state) so it doesn't imply a working feature that isn't there.

---

## Summary table

| # | Gap | Severity | Status |
|---|-----|----------|--------|
| 1 | Mistakes not yet unified with Flow remediation (`status`/`category`/`subsectionId` not persisted) | High — blocks Exam Readiness Score, spaced repetition, Flow Replay | Open |
| 2 | Quiz question repetition (vs. subtopic list duplication, which is fixed) | High — original user complaint likely still unresolved | Open |
| 3 | No prefetch/precompute — generation still on-mount per stage | Medium — perceived speed improved, actual speed not yet addressed | Open |
| 4 | InlineExplainer as popup vs. push-down-in-place | Low–Medium, depends on implementation detail | Needs clarification |
| 5 | "My Journeys" nav item exists despite Journeys being deferred | Low — likely just needs a scope confirmation | Needs clarification |

---

## Suggested next step

Gap 1 is the one worth resolving first — it's the foundation several other planned features (Exam Readiness Score, spaced repetition, Flow Replay) sit on top of, and the longer remediation stays session-local, the more places that data model will need to be retrofitted into later.
