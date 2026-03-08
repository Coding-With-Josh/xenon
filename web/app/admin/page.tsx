"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminStats = {
  overview: {
    totalUsers: number;
    totalQuizzes: number;
    totalExams: number;
    totalNotes: number;
    totalChatSessions: number;
    totalUploads: number;
    usersWithStreak: number;
  };
  users: Array<{
    id: string;
    email: string | null;
    name: string | null;
    classLevel: string | null;
    subjects: unknown;
    createdAt: Date;
    quizCount: number;
    examCount: number;
    notesCount: number;
    chatCount: number;
    uploadCount: number;
    accuracy: number;
    streak: number;
  }>;
  streaks: Array<{ userId: string; email: string | null; name: string | null; streak: number }>;
  recentQuizzes: Array<{
    id: number;
    userId: string;
    type: string;
    subject: string;
    topic: string | null;
    score: number | null;
    totalQuestions: number;
    createdAt: Date;
    email: string | null;
    name: string | null;
  }>;
  recentNotes: Array<{
    id: number;
    userId: string;
    subject: string;
    topic: string | null;
    createdAt: Date;
    email: string | null;
    name: string | null;
  }>;
  recentChatSessions: Array<{
    id: number;
    userId: string;
    title: string;
    updatedAt: Date;
    email: string | null;
    name: string | null;
  }>;
  recentUploads: Array<{
    id: number;
    userId: string;
    type: string;
    createdAt: Date;
    email: string | null;
    name: string | null;
  }>;
};

export default function AdminPage() {
  const [passkey, setPasskey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [userProgress, setUserProgress] = useState<{ user: AdminStats["users"][0]; analytics: unknown } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        setAuthenticated(false);
        return null;
      })
      .then((data) => {
        if (data) {
          setAuthenticated(true);
          setStats(data);
        }
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkey: passkey.trim() }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Invalid passkey");
      return;
    }
    setAuthenticated(true);
    const statsRes = await fetch("/api/admin/stats", { credentials: "include" });
    if (statsRes.ok) setStats(await statsRes.json());
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthenticated(false);
    setStats(null);
    setUserProgress(null);
  }

  async function loadUserProgress(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}`, { credentials: "include" });
    if (!res.ok) {
      setUserProgress(null);
      return;
    }
    const data = await res.json();
    setUserProgress(data);
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Xenon Admin</CardTitle>
            <CardDescription>Enter passkey to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <Input
                type="password"
                placeholder="Passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                autoFocus
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full">Unlock</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const { overview, users: usersList, streaks, recentQuizzes, recentNotes, recentChatSessions, recentUploads } = stats;

  return (
    <div className="p-6 pb-20">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Xenon Admin</h1>
          <p className="text-muted-foreground mt-1">All platform activity, users, and streaks</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>Log out</Button>
      </header>

      {/* Overview KPIs */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase">Total users</p>
              <p className="mt-1 text-2xl font-bold">{overview.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase">Quizzes</p>
              <p className="mt-1 text-2xl font-bold">{overview.totalQuizzes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase">Exams</p>
              <p className="mt-1 text-2xl font-bold">{overview.totalExams}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase">Notes</p>
              <p className="mt-1 text-2xl font-bold">{overview.totalNotes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase">Chat sessions</p>
              <p className="mt-1 text-2xl font-bold">{overview.totalChatSessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase">Uploads</p>
              <p className="mt-1 text-2xl font-bold">{overview.totalUploads}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs font-medium uppercase">Users with streak</p>
              <p className="mt-1 text-2xl font-bold">{overview.usersWithStreak}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Streaks leaderboard */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Streaks — who&apos;s on fire</h2>
        <Card>
          <CardContent className="p-0">
            {streaks.length === 0 ? (
              <p className="p-6 text-muted-foreground text-sm">No active streaks yet.</p>
            ) : (
              <div className="divide-y overflow-x-auto">
                {streaks.map((s, i) => (
                  <div
                    key={s.userId}
                    className="flex items-center justify-between gap-4 px-6 py-3"
                  >
                    <span className="text-muted-foreground w-8 font-mono text-sm">#{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{s.name || s.email || s.userId}</p>
                      {s.email && <p className="text-muted-foreground truncate text-xs">{s.email}</p>}
                    </div>
                    <span className="rounded-full bg-primary/20 px-3 py-1 font-mono text-sm font-semibold">
                      {s.streak} day{s.streak !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Users table + individual progress */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">All users & individual progress</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-medium">User</th>
                        <th className="px-4 py-3 text-right">Class</th>
                        <th className="px-4 py-3 text-right">Quizzes</th>
                        <th className="px-4 py-3 text-right">Exams</th>
                        <th className="px-4 py-3 text-right">Notes</th>
                        <th className="px-4 py-3 text-right">Accuracy</th>
                        <th className="px-4 py-3 text-right">Streak</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="px-4 py-2">
                            <p className="font-medium truncate max-w-[180px]">{u.name || u.email}</p>
                            <p className="text-muted-foreground truncate max-w-[180px] text-xs">{u.email}</p>
                          </td>
                          <td className="px-4 py-2 text-right">{u.classLevel ?? "—"}</td>
                          <td className="px-4 py-2 text-right">{u.quizCount}</td>
                          <td className="px-4 py-2 text-right">{u.examCount}</td>
                          <td className="px-4 py-2 text-right">{u.notesCount}</td>
                          <td className="px-4 py-2 text-right">{u.accuracy}%</td>
                          <td className="px-4 py-2 text-right">{u.streak > 0 ? u.streak : "—"}</td>
                          <td className="px-4 py-2">
                            <Button variant="ghost" size="sm" onClick={() => loadUserProgress(u.id)}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            {userProgress ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Progress: {userProgress.user.name || userProgress.user.email}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setUserProgress(null)}>Close</Button>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-muted-foreground">{userProgress.user.email}</p>
                  <p>Class: {userProgress.user.classLevel ?? "—"} · Subjects: {Array.isArray(userProgress.user.subjects) ? (userProgress.user.subjects as string[]).join(", ") : "—"}</p>
                  {userProgress.analytics && typeof userProgress.analytics === "object" ? (
                    <>
                      <p><strong>Quizzes:</strong> {(userProgress.analytics as { totalQuizzes?: number }).totalQuizzes ?? 0} · <strong>Accuracy:</strong> {(userProgress.analytics as { overallAccuracy?: number }).overallAccuracy ?? 0}%</p>
                      <p><strong>Streak:</strong> {(userProgress.analytics as { streak?: number }).streak ?? 0} days</p>
                      <p><strong>Notes:</strong> {(userProgress.analytics as { notesCount?: number }).notesCount ?? 0}</p>
                      {(userProgress.analytics as { weakTopics?: string[] }).weakTopics?.length ? (
                        <p><strong>Weak topics:</strong> {(userProgress.analytics as { weakTopics: string[] }).weakTopics!.join(", ")}</p>
                      ) : null}
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-muted-foreground text-center text-sm">Click &quot;View&quot; on a user to see their progress.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent quizzes & exams</CardTitle>
              <CardDescription>Last 100</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[320px] space-y-2 overflow-auto">
                {recentQuizzes.slice(0, 30).map((r) => (
                  <div key={r.id} className="flex justify-between gap-2 rounded border bg-muted/30 px-3 py-2 text-sm">
                    <span className="truncate">{r.email ?? r.userId}</span>
                    <span className="text-muted-foreground shrink-0">{r.type} · {r.subject}{r.topic ? ` · ${r.topic}` : ""}</span>
                    <span className="shrink-0">{r.score != null ? `${r.score}/${r.totalQuestions}` : "—"} · {new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent notes</CardTitle>
              <CardDescription>Last 50</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[320px] space-y-2 overflow-auto">
                {recentNotes.slice(0, 25).map((r) => (
                  <div key={r.id} className="flex justify-between gap-2 rounded border bg-muted/30 px-3 py-2 text-sm">
                    <span className="truncate">{r.email ?? r.userId}</span>
                    <span className="truncate">{r.subject} · {r.topic ?? "—"}</span>
                    <span className="text-muted-foreground shrink-0">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent chat sessions</CardTitle>
              <CardDescription>Last 50</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[280px] space-y-2 overflow-auto">
                {recentChatSessions.slice(0, 25).map((r) => (
                  <div key={r.id} className="flex justify-between gap-2 rounded border bg-muted/30 px-3 py-2 text-sm">
                    <span className="truncate">{r.email ?? r.userId}</span>
                    <span className="truncate">{r.title}</span>
                    <span className="text-muted-foreground shrink-0">{new Date(r.updatedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent uploads</CardTitle>
              <CardDescription>Last 50</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[280px] space-y-2 overflow-auto">
                {recentUploads.slice(0, 25).map((r) => (
                  <div key={r.id} className="flex justify-between gap-2 rounded border bg-muted/30 px-3 py-2 text-sm">
                    <span className="truncate">{r.email ?? r.userId}</span>
                    <span>{r.type}</span>
                    <span className="text-muted-foreground shrink-0">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
