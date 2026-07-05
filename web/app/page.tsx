import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { FadeIn } from "@/components/fade-in";
import { db, chatMessages, generatedContent, quizSessions, users } from "@/db";
import { count, eq } from "drizzle-orm";

const featureCards = [
  {
    number: "01.",
    icon: "↯",
    title: "Notes\nGenerator",
    copy: "Generate study notes by topic with full-note mode, Markdown structure, and LaTeX math rendering.",
    className: "lg:mt-16",
  },
  {
    number: "02.",
    icon: "◉",
    title: "Upload PDFs.\nGet Notes + Quiz.",
    copy:
      "Upload PDFs and turn the content into instant study notes and WAEC or JAMB-style quizzes without leaving the flow.",
    featured: true,
  },
  {
    number: "03.",
    icon: "⌁",
    title: "Xe AI\nTutor",
    copy: "Chat with an AI tutor for explanations, notes, and practice questions, with conversations saved for later.",
    className: "lg:mt-16",
  },
  {
    number: "04.",
    icon: "◴",
    title: "Analytics +\nMistakes",
    copy: "Track progress, accuracy trends, weak topics, streaks, and review wrong answers with AI explanations.",
    className: "lg:mt-16",
  },
];

function formatMetric(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M+`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K+`;
  return `${value}+`;
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const [totalUsers, totalNotes, totalReplies, totalQuizzes] = await (async () => {
    try {
      const [usersResult, notesResult, repliesResult, quizzesResult] = await Promise.all([
        db.select({ value: count() }).from(users),
        db.select({ value: count() }).from(generatedContent).where(eq(generatedContent.type, "notes")),
        db.select({ value: count() }).from(chatMessages).where(eq(chatMessages.role, "assistant")),
        db.select({ value: count() }).from(quizSessions).where(eq(quizSessions.type, "quiz")),
      ]);

      return [
        usersResult[0]?.value ?? 0,
        notesResult[0]?.value ?? 0,
        repliesResult[0]?.value ?? 0,
        quizzesResult[0]?.value ?? 0,
      ];
    } catch {
      return [0, 0, 0, 0] as const;
    }
  })();

  const metrics = [
    {
      value: formatMetric(totalUsers),
      label: "students using Xenon",
      copy: "Total registered users learning with the platform.",
    },
    {
      value: formatMetric(totalNotes),
      label: "notes generated",
      copy: "Study notes created across topics, subjects, and revision sessions.",
    },
    {
      value: formatMetric(totalReplies),
      label: "AI replies delivered",
      copy: "Xe AI responses sent to guide explanations, answers, and learning support.",
    },
    {
      value: formatMetric(totalQuizzes),
      label: "quizzes generated",
      copy: "Practice quiz sessions created for WAEC and JAMB preparation.",
    },
  ];

  return (
    <main className="bg-[#f5f3f8] text-[#14151d] dark:bg-[#0b0a12] dark:text-[#e8e4f0]">
      <section className="relative min-h-svh overflow-hidden bg-[#ddd7ef] text-[#14151d] dark:bg-[#130f22] dark:text-[#e8e4f0]">
        <div className="absolute blur-md inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,248,255,0.96),rgba(236,229,247,0.3)_34%,rgba(184,186,224,0.52)_66%,rgba(96,97,160,0.72)_100%)] dark:bg-[radial-gradient(circle_at_50%_22%,rgba(60,40,120,0.6),rgba(40,25,90,0.5)_34%,rgba(30,20,70,0.6)_66%,rgba(15,10,40,0.8)_100%)]" />
        <div className="absolute blur-md inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(160deg,transparent_0_22%,rgba(117,118,196,0.96)_23%_44%,rgba(171,124,222,0.92)_45%_48%,rgba(94,87,176,0.95)_49%_73%,rgba(55,46,122,0.98)_74%)] dark:bg-[linear-gradient(160deg,transparent_0_22%,rgba(60,50,140,0.8)_23%_44%,rgba(100,60,160,0.7)_45%_48%,rgba(50,40,120,0.8)_49%_73%,rgba(30,20,80,0.9)_74%)]" />
        <div className="absolute bottom-[14%] left-[-8%] h-[50%] w-[42%] rounded-[48%_52%_44%_56%] bg-[linear-gradient(128deg,#cfccdb_0%,#9f9fbe_34%,#676694_35%,#8b88ad_52%,transparent_53%)] opacity-80 blur-[0.2px] dark:bg-[linear-gradient(128deg,#3a3550_0%,#2e2a48_34%,#1e1a38_35%,#252240_52%,transparent_53%)]" />
        <div className="absolute blur-md bottom-[21%] right-[-7%] h-[39%] w-[38%] rounded-[60%_40%_53%_47%] bg-[linear-gradient(145deg,rgba(191,186,215,0.48),rgba(103,98,157,0.62)_45%,transparent_46%)] dark:bg-[linear-gradient(145deg,rgba(60,50,100,0.4),rgba(40,35,80,0.5)_45%,transparent_46%)]" />
        <div className="absolute blur-md bottom-[27%] left-[13%] h-20 w-28 -rotate-6 rounded-sm border border-white/35 bg-[#d8d0ea] shadow-2xl before:absolute before:-top-9 before:left-[-3px] before:h-10 before:w-[118px] before:skew-x-[-16deg] before:bg-[#4b436a] after:absolute after:left-0 after:top-0 after:h-full after:w-full after:bg-[linear-gradient(90deg,rgba(255,255,255,0.2),transparent)] max-md:hidden dark:border-white/10 dark:bg-[#2a2548] before:dark:bg-[#6a62a0] after:dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.05),transparent)]" />
        <div className="absolute blur-md bottom-0 left-0 right-0 h-[30%] bg-[radial-gradient(circle_at_9%_82%,#9a63ff_0_0.8%,transparent_1%),radial-gradient(circle_at_17%_77%,#d5b2ff_0_0.7%,transparent_1%),radial-gradient(circle_at_29%_78%,#8d58f6_0_0.9%,transparent_1.2%),radial-gradient(circle_at_48%_80%,#faf6ff_0_0.65%,transparent_0.9%),radial-gradient(circle_at_69%_76%,#b16ff3_0_0.9%,transparent_1.2%),radial-gradient(circle_at_82%_81%,#c6a0ff_0_0.7%,transparent_0.95%),radial-gradient(circle_at_92%_76%,#7a48ea_0_0.85%,transparent_1.1%)] opacity-95 dark:bg-[radial-gradient(circle_at_9%_82%,#7a48ea_0_0.8%,transparent_1%),radial-gradient(circle_at_17%_77%,#9a63ff_0_0.7%,transparent_1%),radial-gradient(circle_at_29%_78%,#6a38d0_0_0.9%,transparent_1.2%),radial-gradient(circle_at_48%_80%,#4a3880_0_0.65%,transparent_0.9%),radial-gradient(circle_at_69%_76%,#8d58f6_0_0.9%,transparent_1.2%),radial-gradient(circle_at_82%_81%,#7a48ea_0_0.7%,transparent_0.95%),radial-gradient(circle_at_92%_76%,#5a28c0_0_0.85%,transparent_1.1%)]" />
        <div className="absolute blur-md bottom-0 left-0 right-0 h-[24%] bg-[linear-gradient(180deg,transparent,rgba(40,28,92,0.44))] backdrop-blur-[1px] dark:bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.6))]" />

        <nav className="scale-120 relative z-10 mx-auto mt-6 flex w-[min(94vw,640px)] items-center justify-between rounded-full border border-white/70 bg-white/88 px-3 py-2 text-[11px] shadow-[0_16px_45px_rgba(49,36,90,0.16)] backdrop-blur-md dark:border-white/10 dark:bg-[#1a1630]/88 dark:shadow-[0_16px_45px_rgba(0,0,0,0.4)] animate-[fade-in_0.6s_ease-out]">
          <Link href="/" className="flex items-center gap-1.5 font-semibold">
            <span className="grid size-4 place-items-center rounded-full bg-[#5a2dff] text-[8px] text-white dark:bg-[#7a4dff]">✦</span>
            Xenon
          </Link>
          <div className="hidden items-center gap-7 font-medium text-md text-[#1b1d24]/70 sm:flex dark:text-white/60">
            <Link href="/" className="transition hover:text-[#1b1d24] dark:hover:text-white">Home</Link>
            <Link href="/signup" className="transition hover:text-[#1b1d24] dark:hover:text-white">Usecases</Link>
            <Link href="/signup" className="transition hover:text-[#1b1d24] dark:hover:text-white">Pricing</Link>
            <Link href="/login" className="transition hover:text-[#1b1d24] dark:hover:text-white">Founder</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="rounded-full bg-[#11121a] px-4 py-2 font-medium text-white shadow-lg transition hover:bg-black dark:bg-white dark:text-[#11121a] dark:hover:bg-[#e8e4f0]">
              {session?.user ? "Go to dashboard" : "Login"}
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl flex-col items-center px-6 pt-[12vh] text-center sm:px-8 sm:pt-[16vh]">
          {/* <div className="mb-5 rounded-full border border-white/70 bg-white/78 px-4 py-2 text-[11px] font-medium text-[#1b1d24]/75 shadow-[0_12px_35px_rgba(58,39,121,0.08)] backdrop-blur-md dark:border-white/15 dark:bg-[#1a1630]/78 dark:text-white/70 dark:shadow-[0_12px_35px_rgba(0,0,0,0.3)]">
            AI exam prep for WAEC & JAMB ✦
          </div> */}

          <h1 className="max-w-5xl text-balance text-5xl font-bold leading-[0.92] tracking-[-0.05em] text-[#191923] drop-shadow-[0_1px_18px_rgba(255,255,255,0.36)] sm:text-7xl lg:text-[7rem] dark:text-[#e8e4f2] dark:drop-shadow-[0_1px_18px_rgba(100,70,200,0.4)] animate-[fade-in-up_0.7s_cubic-bezier(0.16,1,0.3,1)_0.15s_both]">
            Ignite your dreams.
          </h1>
          <p className="mt-5 max-w-2xl text-balance text-base font-semibold leading-6 text-[#23242c]/90 sm:text-lg dark:text-[#c8c4d8]/80 animate-[fade-in-up_0.7s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]">
            Learn smarter with Xe AI, notes, quizzes, and exam practice built around your class level.
            So you can take a breath.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row animate-[fade-in-up_0.7s_cubic-bezier(0.16,1,0.3,1)_0.45s_both]">
            <Link href="/signup" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#151720] shadow-[0_18px_45px_rgba(49,36,90,0.22)] transition hover:-translate-y-0.5 hover:bg-[#faf7ff] dark:bg-[#e8e4f0] dark:text-[#0b0a12] dark:shadow-[0_18px_45px_rgba(0,0,0,0.4)] dark:hover:bg-white">
              {session?.user ? "Go to dashboard" : "Get Started"} →
            </Link>
            <Link href="/login" className="rounded-full px-6 py-3 text-sm font-semibold text-[#151720] transition hover:bg-white/55 dark:text-[#c8c4d8] dark:hover:bg-white/10">
              Watch Demo
            </Link>
          </div>
        </div>


      </section>

      <section className="relative rounded-b-3xl flex h-screen overflow-hidden bg-[#f8f7fb] px-3 py-10 sm:px-4 lg:px-6 lg:py-10 dark:bg-[#0e0c18]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.88),transparent_48%),linear-gradient(rgba(193,185,225,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(193,185,225,0.24)_1px,transparent_1px)] bg-[size:auto,52px_52px,52px_52px] dark:bg-[radial-gradient(circle_at_top,rgba(30,20,60,0.6),transparent_48%),linear-gradient(rgba(80,70,140,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(80,70,140,0.12)_1px,transparent_1px)]" />
        <div className="absolute inset-x-[12%] top-0 h-40 bg-[radial-gradient(circle,rgba(255,255,255,0.8),transparent_70%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(100,70,200,0.1),transparent_70%)]" />

        <div className="relative mx-auto flex h-full w-full max-w-[1240px] flex-col justify-between">
          <FadeIn>
          <div className="grid gap-8 lg:grid-cols-[1.55fr_0.95fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ece7f8] bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.02em] text-[#7652d8] shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur-md dark:border-white/8 dark:bg-[#18152e]/80 dark:text-[#b290ff] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                <span className="grid size-5 place-items-center rounded-full bg-[#f4f4f2] text-[#1f2025] dark:bg-[#2a2740] dark:text-[#e0dcf0]">✦</span>
                Features
              </div>
              <h2 className="mt-6 max-w-[620px] text-balance text-5xl font-semibold leading-[0.93] tracking-[-0.06em] text-[#0d1220] sm:text-6xl lg:text-[4.5rem] dark:text-[#e8e4f2]">
                We&apos;ve orchestrated <span className="bg-[linear-gradient(180deg,#8d6af2_0%,#5a2dff_85%)] bg-clip-text text-transparent">Intelligence.</span>
              </h2>
            </div>

            <div className="max-w-md justify-self-start pt-2 lg:justify-self-end">
              <p className="text-pretty text-base leading-7 text-[#65676f] sm:text-lg dark:text-[#a09bb5]">
                Xenon brings clarity, not complexity - uniting every learning tool into one adaptive system that teaches, tests, and evolves with each student.
              </p>
              <Link href="/signup" className="mt-7 inline-flex rounded-full bg-[#17181d] px-8 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-black dark:bg-[#e8e4f0] dark:text-[#0b0a12] dark:hover:bg-white">
                Explore More
              </Link>
            </div>
          </div>

          </FadeIn>
          <div className="relative mt-8 grid flex-1 gap-3 lg:grid-cols-[0.82fr_1.48fr_0.82fr_0.82fr] lg:items-start">
            {featureCards.map((card, index) => (
              <FadeIn key={card.number} delay={index * 100}>
              <article
                className={[
                  "relative overflow-hidden rounded-[28px] border border-[#f0ecfa] bg-white/92 px-6 pb-6 pt-6 shadow-[0_18px_50px_rgba(15,18,31,0.05)] dark:border-white/8 dark:bg-[#1a1730]/92 dark:shadow-[0_18px_50px_rgba(0,0,0,0.3)]",
                  card.featured ? "min-h-[440px] lg:min-h-[470px]" : "min-h-[240px] lg:min-h-[360px]",
                  card.className ?? "",
                ].join(" ")}
              >
                <div className="text-[4.8rem] font-medium leading-none tracking-[-0.08em] text-[#ececf2] sm:text-[5.6rem] dark:text-white/6">
                  {card.number}
                </div>

                {card.featured ? (
                  <>
                    <div className="absolute inset-x-4 top-4 h-[170px] overflow-hidden rounded-[24px] border border-white/60 bg-[radial-gradient(circle_at_50%_0%,rgba(245,240,255,0.96),rgba(219,205,255,0.9)_32%,rgba(139,103,241,0.28)_58%,rgba(255,255,255,0.88)_100%)] shadow-[inset_0_0_35px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(35,25,70,0.96),rgba(50,35,100,0.8)_32%,rgba(80,50,160,0.2)_58%,rgba(20,15,45,0.88)_100%)] dark:shadow-[inset_0_0_35px_rgba(0,0,0,0.5)]">
                      <div className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_75%_100%,rgba(118,82,216,0.35)_0_4px,transparent_4px_13px)] opacity-60" />
                      <div className="absolute left-[-10%] top-[20%] h-44 w-[130%] rotate-[-10deg] bg-[repeating-linear-gradient(90deg,rgba(90,45,255,0.16)_0_2px,transparent_2px_11px)] opacity-80" />
                      <div className="absolute inset-x-[8%] bottom-[18%] h-24 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(141,106,242,0.55),rgba(141,106,242,0.12)_35%,transparent_70%)] blur-xl" />
                    </div>

                    <div className="mt-[198px] inline-flex size-9 items-center justify-center rounded-xl bg-[#f5f3ff] text-sm text-[#1b1c21] shadow-[0_8px_18px_rgba(0,0,0,0.05)] dark:bg-[#2a2548] dark:text-[#e0dcf0] dark:shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
                      {card.icon}
                    </div>
                    <h3 className="mt-5 text-4xl font-medium leading-[0.98] tracking-[-0.06em] text-[#0f131c] sm:text-[3.1rem] dark:text-[#e8e4f2]">
                      {card.title.split("\n").map((part) => (
                        <span key={part} className="block">{part}</span>
                      ))}
                    </h3>
                    <p className="mt-8 max-w-[360px] text-base leading-7 text-[#6a6d73] dark:text-[#a09bb5]">
                      {card.copy}
                    </p>
                  </>
                ) : (
                  <div className="mt-20 flex h-[calc(100%-6rem)] flex-col justify-end">
                    <div className="inline-flex size-9 items-center justify-center rounded-xl bg-[#f5f3ff] text-sm text-[#1b1c21] shadow-[0_8px_18px_rgba(0,0,0,0.05)] dark:bg-[#2a2548] dark:text-[#e0dcf0] dark:shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
                      {card.icon}
                    </div>
                    <h3 className="mt-5 text-[1.9rem] font-medium leading-[1.02] tracking-[-0.05em] text-[#12141a] dark:text-[#e8e4f2]">
                      {card.title.split("\n").map((part) => (
                        <span key={part} className="block">{part}</span>
                      ))}
                    </h3>
                    <p className="mt-4 max-w-[220px] text-sm leading-6 text-[#6e7177] dark:text-[#a09bb5]">
                      {card.copy}
                    </p>
                  </div>
                )}

                {index === 0 ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.88))] dark:bg-[linear-gradient(180deg,transparent,rgba(26,23,48,0.88))]" /> : null}
              </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f4f0ff] px-4 py-16 sm:px-5 lg:px-6 lg:py-20 dark:bg-[#0f0b1a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82),transparent_34%),linear-gradient(180deg,rgba(128,91,255,0.08),transparent_36%)] dark:bg-[radial-gradient(circle_at_top,rgba(40,25,80,0.4),transparent_34%),linear-gradient(180deg,rgba(128,91,255,0.12),transparent_36%)]" />
        <div className="relative mx-auto max-w-[1240px]">
          <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-balance text-xl font-medium leading-9 text-[#2b2540] sm:text-2xl sm:leading-10 dark:text-[#ccc8e0]">
              Xenon helps students study smarter with AI-powered notes, quizzes, tutoring, and exam prep built for WAEC and JAMB.
            </p>
          </div>
          </FadeIn>

          <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-[0.95fr_0.95fr_1.15fr_0.95fr]">
            {metrics.map((metric, index) => (
              <FadeIn key={metric.label} delay={index * 100}>
              <article
                className={[
                  "relative rounded-[28px] border border-[#ece6ff] bg-white/88 px-5 pb-6 pt-20 shadow-[0_20px_50px_rgba(57,33,125,0.06)] backdrop-blur-sm sm:px-6 dark:border-white/8 dark:bg-[#1a1730]/88 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
                  index === 2 ? "xl:min-h-[280px]" : "xl:min-h-[280px]",
                ].join(" ")}
              >
                <span className="absolute right-5 top-5 size-2.5 rounded-full bg-[#5a2dff] shadow-[0_0_0_6px_rgba(90,45,255,0.08)] dark:bg-[#7a4dff] dark:shadow-[0_0_0_6px_rgba(122,77,255,0.15)]" />
                <div className="text-5xl font-semibold tracking-[-0.08em] text-[#10111a] sm:text-6xl dark:text-[#e8e4f2]">
                  {metric.value}
                </div>
                <div className="mt-3 max-w-[220px] text-lg font-medium leading-7 text-[#1f2130] dark:text-[#d0cce0]">
                  {metric.label}
                </div>
                <p className="mt-4 max-w-[250px] text-sm leading-6 text-[#6c6780] dark:text-[#a09bb5]">
                  {metric.copy}
                </p>
              </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
