# Xenon

**Ignite your knowledge.**

Xenon is an AI-powered exam preparation platform for Nigerian secondary school students (JSS1–SS3) studying for WAEC and JAMB.

## What it does

- **Xe AI** — Chat with an AI tutor; get notes, explanations, and practice questions. Conversations are saved.
- **Notes** — Generate study notes by topic (with full-note option). Renders Markdown and LaTeX math.
- **Quiz** — WAEC/JAMB-style multiple-choice questions on any topic.
- **Exam simulation** — Timed practice exams.
- **Uploads** — Upload PDFs; generate notes and quizzes from the content.
- **Analytics** — Progress, accuracy trends, weak topics, streak.
- **Mistakes** — Review wrong answers with AI explanations.

## Repo structure

- **`web/`** — The Xenon app (Next.js, Drizzle, NextAuth, Groq). Run and deploy from here.

  See **[web/README.md](web/README.md)** for setup, env vars, and scripts.

## Quick start

```bash
cd web
npm install
cp .env.example .env   # set DATABASE_URL, NEXTAUTH_SECRET, GROQ_API_KEY
npm run db:migrate
npm run db:seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## License

Private / as per your project terms.
