import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const data = await getAnalytics(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium">Analytics</h1>
        <p className="text-muted-foreground text-sm">Your performance and weak areas.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">{data.overallAccuracy ?? 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Study streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">{data.streak ?? 0} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">{data.totalQuizzes ?? 0}</p>
          </CardContent>
        </Card>
      </div>
      {data.weakTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topics to revise</CardTitle>
            <CardDescription>Accuracy below 60%. Focus on these for improvement.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {data.weakTopics.map((t: string) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              <Link href="/chat" className="text-primary underline">Ask Xe</Link> for notes or practice questions on these topics.
            </p>
          </CardContent>
        </Card>
      )}
      {Object.keys(data.topicStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By topic</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Object.entries(data.topicStats).map(([topic, s]) => (
                <li key={topic} className="flex justify-between">
                  <span>{topic}</span>
                  <span>{s.accuracy}% ({s.total} questions)</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
