"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Message01Icon,
  NoteIcon,
  ChatQuestion01Icon,
  Logout01Icon,
  UserIcon,
  FileUploadIcon,
  Clock01Icon,
  Chart01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 px-2 py-2">
            <span className="font-serif text-lg font-semibold">Xenon</span>
          </Link>
          <p className="px-2 text-xs text-muted-foreground">Ignite your knowledge</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Learn</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                    <Link href="/dashboard">
                      <HugeiconsIcon icon={DashboardSquare01Icon} />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith("/chat")}>
                    <Link href="/chat">
                      <HugeiconsIcon icon={Message01Icon} />
                      <span>Xe AI</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith("/notes")}>
                    <Link href="/notes">
                      <HugeiconsIcon icon={NoteIcon} />
                      <span>Notes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith("/quiz")}>
                    <Link href="/dashboard">
                      <HugeiconsIcon icon={ChatQuestion01Icon} />
                      <span>Quiz</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith("/uploads")}>
                    <Link href="/uploads">
                      <HugeiconsIcon icon={FileUploadIcon} />
                      <span>Uploads</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith("/exam")}>
                    <Link href="/exam">
                      <HugeiconsIcon icon={Clock01Icon} />
                      <span>Exam</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith("/analytics")}>
                    <Link href="/analytics">
                      <HugeiconsIcon icon={Chart01Icon} />
                      <span>Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith("/mistakes")}>
                    <Link href="/mistakes">
                      <HugeiconsIcon icon={Cancel01Icon} />
                      <span>Mistakes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/profile">
                  <HugeiconsIcon icon={UserIcon} />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => signOut({ callbackUrl: "/" })}>
                <HugeiconsIcon icon={Logout01Icon} />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="flex-1 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
