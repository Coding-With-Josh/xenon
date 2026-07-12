# Xenon — What We've Built

## UI/UX Changes

### Text Scaling
- Set `font-size: 115%` on `html` in `globals.css` — scales all text up for better readability across the app.

### Dashboard Search → Command Center
- Replaced the static search input with a **tappable `<SearchTrigger>`** button that looks identical to the old input but has `active:scale-[0.98]` tap feedback.
- Built a full **command palette** (`CommandCenter`) using `cmdk` + Radix Dialog:
  - Opens on **Cmd+K** (Mac) / **Ctrl+K** (Windows) from any page.
  - Opens on tapping the search bar on the dashboard.
  - **Navigate** group — all 13 sidebar pages with matching Hugeicons.
  - **Actions** group — Generate Quiz, Start Study Plan, Take Exam.
  - Fuzzy search filters both groups.
  - Keyboard shortcut footer (`↑↓` navigate / `↵` open / `esc` close).
  - Fade-in + zoom-in animation via `tw-animate-css` and Radix Dialog.
  - Global via `CommandCenterProvider` context in the app layout.

### Sidebar Restructuring
- Removed collapsibles and chevrons.
- Sections: **Home** link, **Learn** section (My Journeys, My Flow, My Streak, Mistakes), **Tools** section (Notes, Quizzes, Exam Simulation, Xe AI), divider, **Other** (Notifications, Analytics), **Account** (Settings, Feedback).
- **Dynamic section labels** — when any item in a section is active, the section heading turns `text-foreground` (opaque) instead of `text-muted-foreground`.
- **Fixed "My Streak" always-active bug** — extracted `isActive(href)` helper; `/dashboard` items only match sub-paths, leaving exact `/dashboard` match for the Home link.

### Animations
- Fade/slide-in on stage transitions using Tailwind's `animate-in fade-in slide-in-from-bottom-4` classes.
- Progress bar spring-like transition (`transition-all duration-700 ease-out`).
- Button hover/tap scale micro-interactions (`active:scale-[0.98]`).
- Shimmer loading components (`NotesShimmer`, `MicroCheckShimmer`) with custom `shimmer` keyframe.
- Command center zoom-in + fade entrance via Radix Dialog + `tw-animate-css`.

### New UI Components
- **`Spinner`** — reusable SVG spinner, replaced all text-based loading states ("Loading...", "Submitting...", "Retrying...").
- **`ErrorState`** — reusable error display with retry/skip/exit buttons and spinner.
- **`InlineExplainer`** — text selection on notes triggers "Explain this" popup → fetches AI explanation.
- **`SearchTrigger`** — tappable search bar button with Command+K badge.
- **`CommandCenter`** — cmdk-based command palette.
- **`CommandCenterProvider`** — React context for global Cmd+K access.

### Notes Stage
- Replaced raw text output with `ReactMarkdown` (GFM + math + KaTeX) for formatted rendering.
- Read-out button (`AudioBook01Icon` in header — UI only).
- Auto-generation on mount via `useEffect` when no notes exist.
- Shimmer loading state.

### Micro-Check Stage
- Fully interactive: option selection, submission, inline results (correct/incorrect highlighting with explanations).
- Auto-generation on mount when no questions exist.
- Shimmer loading state.

### Quiz Stage
- Full quiz component: **objective questions** (A–D option buttons with correct/incorrect highlighting) and **theory questions** (expandable marking scheme + model answer).
- Submit → hits `submit-quiz` API → inline results per question.
- "Review mistakes" button routes to remediation; "Mark complete" routes to mastery.
- Auto-generates 10 WAEC-standard questions via `generate-stage` API on mount.
- Shimmer loading skeleton while generating.

### Remediation Stage
- Reads quiz results to identify wrong subsections.
- Loads AI-generated **concept explanations** + fresh micro-check **retry questions** per wrong subsection via the `remediate` API.
- Walks through each subsection one at a time.
- Submit reveals correct/incorrect with explanations.
- Advances through subsections → continues to mastery.

### Mastery Stage
- **4-tab layout** with AI-generated content specific to the topic:
  1. **Exam Tips** — 3–5 WAEC/JAMB-focused tips.
  2. **Mnemonics** — memory tricks (acronyms, rhymes) + abbreviations table.
  3. **Shortcuts & Formulas** — calculation tricks + key formulas.
  4. **Flashcards** — 8–10 flip cards with front/back reveal, mastery tracking, prev/next navigation.
- Shows quiz score with percentage at the top.
- "Mark topic as complete" → sets session `completed` → redirects to dashboard.
- Generates content via the new `/api/flows/[id]/mastery` endpoint.
- Shimmer loading while generating.

## Flow Logic Changes

### URL Slugs
- Added `slug` column to `flow_sessions` table.
- Created `slugify()` helper in `lib/utils.ts`.
- Renamed route from `[id]` to `[slug]`.
- Updated start API to generate slugs, and all lookups to use slugs.

### Flow Engine
- **Auto-generation on mount** — `useEffect` in notes, micro-check, and quiz stages triggers generation when the component mounts with no content.
- **Quiz → Remediation → Mastery pipeline**:
  - Quiz submitted → `submit-quiz` API saves `wrongSubsectionIds`.
  - `advance` route reads `wrongSubsectionIds` and routes to remediation (if wrong answers) or mastery (if all correct).
  - Remediation walks wrong subsections → advances to mastery.
  - Mastery marks session as `completed`.
- **`generate-stage` API** — added `case "quiz"` that calls `generateQuiz()` for auto-generation.
- **`advance` route** — added dynamic `quiz → remediation/mastery` branching + `mastery → complete` handling.

### Deduplication
- Added `dedupe()` helper and applied in all 5 places where curriculum subtopics are fetched, fixing subtopic duplication.

### AI Prompts
- Updated notes prompts to request **2–3 worked examples** for calculation topics.
- Added `buildMasteryPrompt` for the mastery stage (exam tips, mnemonics, abbreviations, shortcuts, flashcards).
- All prompts use the Nigerian WAEC/JAMB exam context.

### New API Routes
- `/api/flows/[id]/mastery` — generates mastery guide content.
- `/api/explain` — inline explainer text selection endpoint.

## Dependencies Added
- `cmdk` — command palette component.

## New Files Created

```
web/
├── components/
│   ├── command-center.tsx           # Command palette (cmdk + Radix Dialog)
│   ├── command-center-provider.tsx   # React context for global access
│   ├── search-trigger.tsx           # Tappable search bar button
│   ├── flows/
│   │   ├── quiz-stage.tsx           # Full quiz with objective + theory
│   │   ├── remediation-stage.tsx    # Remediation per wrong subsection
│   │   └── mastery-stage.tsx        # 4-tab mastery guide + flashcards
│   └── ui/
│       ├── shimmer.tsx              # Shimmer loading skeletons
│       ├── spinner.tsx              # SVG spinner
│       └── error-state.tsx          # Error with retry/skip/exit
├── app/api/flows/[id]/
│   └── mastery/route.ts             # Mastery content generation
└── app/(app)/dashboard/
    └── dashboard-client.tsx         # Client wrapper for command center trigger
```

## Files Modified

| File | Changes |
|------|---------|
| `web/app/globals.css` | Added `font-size: 115%`, shimmer keyframes |
| `web/app/(app)/layout.tsx` | Wrapped in `CommandCenterProvider` |
| `web/app/(app)/dashboard/page.tsx` | Replaced search bar with `<DashboardClient />` |
| `web/components/blocks/sidebar.tsx` | Dynamic section labels, My Streak active fix |
| `web/components/flows/flow-stage-renderer.tsx` | Wired `RemediationStage` + `MasteryStage` |
| `web/lib/flows/types.ts` | Added `MasteryContent`, updated `MasteryData`, `QuizData` |
| `web/lib/ai/prompts.ts` | Added `buildMasteryPrompt` |
| `web/lib/ai/flows.ts` | Added `generateMastery`, imported `buildMasteryPrompt` |
| `web/app/api/flows/[id]/generate-stage/route.ts` | Added `case "quiz"` for auto-generation |
| `web/app/api/flows/[id]/advance/route.ts` | Quiz → remediation/mastery branching, mastery completion |
