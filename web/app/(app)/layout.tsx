"use client";

import Sidebar from "@/components/blocks/sidebar";
import { CommandCenterProvider } from "@/components/command-center-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandCenterProvider>
      <div className="w-screen h-screen flex py-4 items-center bg-[#ebebed] dark:bg-[#0f0f12] overflow-hidden">
        <Sidebar/>
        <div className="flex-1 my-6 mx-4 w-full h-full bg-[#f3f2f4] dark:bg-black rounded-2xl py-10 px-8 overflow-y-scroll">{children}
          <div className="w-full h-20"/>
        </div>
      </div>
    </CommandCenterProvider>
  );
}
