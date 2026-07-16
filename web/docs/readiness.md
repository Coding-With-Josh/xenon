# Exam Readiness Score

## Formula

```
adjustedAccuracy = (totalCorrect + 15 * 0.5) / (totalQuestions + 15)
coverageRatio   = distinctTopicsAttempted / totalTopicsInSyllabus

examReadiness   = null                                                    if totalQuestions < 20
                = min(100, round(adjustedAccuracy * 70 + coverageRatio * 15 + strengths * 3))
```

## Components

### 1. Smoothed Accuracy (`adjustedAccuracy * 70`) — max 70 pts

```
adjustedAccuracy = (totalCorrect + priorWeight * priorMean) / (totalQuestions + priorWeight)
```

Where `priorWeight = 15` and `priorMean = 0.5`. This is a Bayesian additive (Beta) smoothing that pulls raw accuracy toward 50% when the sample size is small. As `totalQuestions` grows, the prior's influence shrinks and the value converges toward the student's true accuracy.

| totalQuestions | prior influence | example (6/6 = 100% raw) |
|----------------|-----------------|--------------------------|
| 6              | 71% prior       | smoothed: 64%            |
| 20             | 43% prior       | smoothed: 79%            |
| 50             | 23% prior       | smoothed: 89%            |
| 100            | 13% prior       | smoothed: 94%            |

### 2. Syllabus Coverage (`coverageRatio * 15`) — max 15 pts

```
coverageRatio = distinctTopicsAttempted / totalTopicsInSyllabus
```

`distinctTopicsAttempted` — unique `quizSessions.topic` values the student has attempted across all sessions.
`totalTopicsInSyllabus` — total topics across all subjects in the WAEC curriculum that are available for the student's class level (queried from the `curriculum` table, filtered by `classLevels` array).

This replaces the old flat `topics * 2` bonus that had no denominator. Now touching 4 of 8 Chemistry topics scores higher than touching 4 of 40 across all subjects, reflecting actual syllabus coverage.

### 3. Mastery Bonus (`strengths * 3`) — uncapped

A topic is considered a **strength** when it has:
- ≥ 5 question attempts across all sessions
- ≥ 80% accuracy on those attempts

Each such topic adds 3 points. Reduced from 5 in the old formula to account for the new coverage component.

### 4. Minimum Data Gate

If `totalQuestions < 20`, `examReadiness` returns `null` instead of a numeric score. The dashboard displays `—` and a "Answer more questions to see your score" message. This prevents small-sample noise from being misinterpreted as a meaningful readiness signal.

## Source

`web/lib/analytics.ts:87-89`

```typescript
const examReadiness = totalQuestions < MIN_QUESTIONS
  ? null
  : Math.min(100, Math.round(adjustedAccuracy * 70 + coverageRatio * 15 + strengths.length * 3));
```

## Constants

| Constant | Value | File |
|----------|-------|------|
| `PRIOR_WEIGHT` | 15 | `lib/analytics.ts:6` |
| `PRIOR_MEAN` | 0.5 | `lib/analytics.ts:7` |
| `MIN_QUESTIONS` | 20 | `lib/analytics.ts:8` |
| Accuracy weight | 70 | `lib/analytics.ts:89` |
| Coverage weight | 15 | `lib/analytics.ts:89` |
| Strength weight | 3 | `lib/analytics.ts:89` |

## Data Sources

| Table | Columns | Usage |
|-------|---------|-------|
| `quizSessions` | `score`, `totalQuestions`, `topic`, `subject`, `userId` | Accuracy calculation, topic tracking |
| `questionAttempts` | `correct`, `sessionId` | Per-topic accuracy via join with `quizSessions` |
| `curriculum` | `classLevels` | Syllabus topic count filtered by student's class level |

## Weak Topics (related concept)

Defined at `web/lib/analytics.ts:41-43` with threshold `WEAK_THRESHOLD = 0.6`:

```typescript
const weakTopics = Object.entries(topicStats)
  .filter(([, s]) => s.total >= 3 && s.correct / s.total < WEAK_THRESHOLD)
  .map(([topic]) => topic);
```

A topic is "weak" when it has ≥ 3 attempts and < 60% accuracy.

## Consumer

Displayed in `web/app/(app)/dashboard/metrics-panel.tsx:60-75` as the middle "Readiness" metric card with a progress bar. Passed through `getDashboardData()` → `data.analytics.examReadiness`. When `null`, the card shows `—` and a guidance message instead of a percentage.

## Limitations

- No recency weighting — a perfect score from 6 months ago counts the same as today
- No exam simulation weighting — timed exam attempts aren't differentiated from untimed quizzes
- No difficulty scaling — all questions weighted equally regardless of complexity
- Streak not included in readiness (tracked separately)
- Coverage ratio aggregates across all subjects — a student studying one subject exhaustively but ignoring others will show lower coverage than one sampling evenly
