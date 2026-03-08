# Xenon

**Ignite your knowledge.** AI-powered exam preparation for Nigerian secondary school students (JSS1–SS3) preparing for WAEC and JAMB.

## What it is

Xenon helps students study with:

- **Xe AI** — Chat with an AI tutor for notes, explanations, and practice questions. Previous conversations are saved and can be reopened.
- **Notes** — Generate structured study notes by topic (with optional “full note” for exam-ready revision). Notes support Markdown and LaTeX math (e.g. formulas and calculations).
- **Quiz** — Generate WAEC/JAMB-style multiple-choice questions on any topic.
- **Exam simulation** — Timed practice exams with configurable length and duration.
- **Uploads** — Upload PDFs; the app extracts text and can generate notes and quizzes from the content.
- **Analytics** — Dashboard with accuracy trends, topic performance, weak topics, and study streak.
- **Mistakes** — Review wrong answers with AI explanations and recommendations.

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes, NextAuth (Credentials + JWT)
- **Database:** PostgreSQL with Drizzle ORM
- **AI:** Groq (Llama) for chat, notes, quiz, and explanations
- **Rendering:** react-markdown, remark-gfm, remark-math, rehype-katex (KaTeX) for math in notes and chat

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL (local or e.g. Supabase)
- [Groq API key](https://console.groq.com/) for AI features

### Setup

1. Clone the repo and go into the web app:

   ```bash
   cd xenon/web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy env and configure:

   ```bash
   cp .env.example .env
   ```

   Set at least:

   - `DATABASE_URL` — PostgreSQL connection string
   - `NEXTAUTH_SECRET` — random secret for sessions (e.g. `openssl rand -base64 32`)
   - `GROQ_API_KEY` — your Groq API key

4. Run migrations and seed curriculum (Physics, Chemistry, Biology, English Language):

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up (credentials) and complete onboarding (class level + subjects), then use the dashboard, Xe AI, notes, quiz, and exam.

### Scripts

| Command         | Description                |
|----------------|----------------------------|
| `npm run dev`  | Start dev server (Turbopack) |
| `npm run build`| Production build           |
| `npm run start`| Start production server     |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:push`    | Push schema (dev)     |
| `npm run db:seed`    | Seed curriculum       |
| `npm run db:studio`  | Open Drizzle Studio   |

## Project structure (high level)

- `app/` — Next.js App Router: auth, onboarding, dashboard, chat, notes, quiz, exam, uploads, analytics, mistakes, profile
- `app/api/` — API routes: auth, profile, chat (and chat sessions), notes/generate, quiz, exam, uploads, analytics
- `components/` — UI (shadcn) and layout components
- `db/` — Drizzle schema and seed
- `lib/` — auth, analytics, curriculum, AI (chat, notes, quiz, prompts), Groq client

## License

Private / as per your project terms.
