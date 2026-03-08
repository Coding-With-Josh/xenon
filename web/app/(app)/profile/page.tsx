import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const classLevel = (session.user as { classLevel?: string }).classLevel;
  const subjects = (session.user as { subjects?: string[] }).subjects ?? [];
  if (!classLevel) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Update your class level and subjects.
        </p>
      </div>
      <ProfileForm initialClassLevel={classLevel} initialSubjects={subjects} />
    </div>
  );
}
