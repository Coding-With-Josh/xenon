import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAnalytics } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenerateQuizCard } from "./generate-quiz-card";
import { StudyPlannerCard } from "./study-planner-card";
import { AccuracyChart } from "./accuracy-chart";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const classLevel = (session.user as { classLevel?: string }).classLevel;
  const subjects = (session.user as { subjects?: string[] }).subjects ?? [];
  if (!classLevel) redirect("/onboarding");
  const a = await getAnalytics(session.user.id);

  const topicList = Object.entries(a.topicStats ?? {}).map(([name, s]) => ({
    name,
    ...s,
  })).sort((x, y) => y.total - x.total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. You&apos;re in {classLevel} studying {subjects.join(", ") || "science"}.
        </p>
      </div>

      {/* KPI cards */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Your progress at a glance</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Overall accuracy</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{a.overallAccuracy}%</p>
              <p className="text-muted-foreground mt-0.5 text-xs">Across all quizzes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Quizzes done</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{a.totalQuizzes}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">Practice sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Questions answered</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{a.totalQuestions}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">{a.totalCorrect} correct</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Notes saved</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{a.notesCount ?? 0}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">Study notes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Study streak</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{a.streak}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">Days in a row</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Accuracy trend chart */}
      <Card>
        <CardHeader>
          <CardTitle>Accuracy trend</CardTitle>
          <CardDescription>Your quiz performance over recent sessions. Hover for details.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccuracyChart data={a.recentSessionsForChart ?? []} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <StudyPlannerCard />
        <GenerateQuizCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Topic performance */}
        <Card>
          <CardHeader>
            <CardTitle>Topic performance</CardTitle>
            <CardDescription>How you&apos;re doing by topic. Focus on low-accuracy areas.</CardDescription>
          </CardHeader>
          <CardContent>
            {topicList.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No quiz data yet. Start a quiz to see topic breakdown.
              </p>
            ) : (
              <div className="space-y-2">
                {topicList.slice(0, 8).map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <span className="text-sm font-medium truncate max-w-[60%]">{t.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">{t.correct}/{t.total}</span>
                      <span
                        className={`tabular-nums text-sm font-medium ${t.accuracy >= 70 ? "text-green-600 dark:text-green-400" : t.accuracy >= 50 ? "text-amber-600 dark:text-amber-400" : "text-destructive"
                          }`}
                      >
                        {t.accuracy}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exam Readiness Score */}
        <div className="space-y-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">WAEC/JAMB Readiness</CardTitle>
              <div className="text-5xl font-bold text-primary mt-2">{a.examReadiness}%</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {a.strengths.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                      <span>✔</span> STRONG IN
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {a.strengths.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {a.weakTopics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-destructive flex items-center gap-1">
                      <span>❗</span> WEAK IN
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {a.weakTopics.slice(0, 3).map(w => (
                        <span key={w} className="text-[10px] px-2 py-0.5 bg-destructive/10 text-destructive rounded-full border border-destructive/20">{w}</span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-center text-muted-foreground italic">
                  Keep practicing to boost your score!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Weak topics + quick actions (Original) */}
          {a.weakTopics.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base">Topics to revise</CardTitle>
                <CardDescription>You could improve here. Practice with Xe or take a topic quiz.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc text-sm space-y-1">
                  {a.weakTopics.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <Button asChild className="mt-4" variant="outline" size="sm">
                  <Link href="/chat">Ask Xe for help</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
              <CardDescription>Notes, chat, and exam simulation.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/chat">Open Xe AI</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/notes">Notes</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/exam">Exam simulation</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
