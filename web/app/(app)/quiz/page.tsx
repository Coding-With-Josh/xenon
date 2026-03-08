import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenerateQuizCard } from "@/app/(app)/dashboard/generate-quiz-card";

export default async function QuizPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const classLevel = (session.user as { classLevel?: string }).classLevel;
  if (!classLevel) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium">Quiz</h1>
        <p className="text-muted-foreground text-sm">
          Generate WAEC/JAMB-style practice questions on any topic. Answer, submit, and see your score with explanations.
        </p>
      </div>
      <GenerateQuizCard />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timed exam</CardTitle>
          <CardDescription>
            Full-length timed exam simulation with multiple subjects. Set duration and question count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/exam">Start exam simulation</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
