import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-4xl font-semibold">Xenon</h1>
        <p className="text-muted-foreground">Ignite your knowledge and preparation</p>
      </div>
      <p className="text-center text-sm max-w-md">
        AI-powered exam preparation for Nigerian secondary school students. Study smarter for WAEC and JAMB.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    </div>
  );
}
