import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import "katex/dist/katex.min.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/session-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";

const sfProRounded = localFont({
  src: [
    { path: "../assets/SF Pro Rounded/SF-Pro-Rounded-Medium.otf", weight: "500", style: "normal" },
    { path: "../assets/SF Pro Rounded/SF-Pro-Rounded-Semibold.otf", weight: "600", style: "normal" },
    { path: "../assets/SF Pro Rounded/SF-Pro-Rounded-Bold.otf", weight: "700", style: "normal" },
    { path: "../assets/SF Pro Rounded/SF-Pro-Rounded-Regular.otf", weight: "400", style: "normal" },
    { path: "../assets/SF Pro Rounded/SF-Pro-Rounded-Light.otf", weight: "350", style: "normal" },
    { path: "../assets/SF Pro Rounded/SF-Pro-Rounded-Heavy.otf", weight: "800", style: "normal" },
    { path: "../assets/SF Pro Rounded/SF-Pro-Rounded-Black.otf", weight: "900", style: "normal" },
    { path: "../assets/SF Pro Rounded/SF-Pro-Rounded-Ultralight.otf", weight: "200", style: "normal" },
    { path: "../assets/SF Pro Rounded/SF-Pro-Rounded-Thin.otf", weight: "300", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: true,
})
const serif = localFont({
  src: [
    { path: "../assets/Lora/Lora-VariableFont_wght.ttf", weight: "400 700", style: "normal" },
    { path: "../assets/Lora/Lora-Italic-VariableFont_wght.ttf", weight: "400 700", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
  preload: true,
})


const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Xenon - Ignite your knowledge and preparation",
  description: "AI-powered exam preparation for Nigerian secondary school students. WAEC and JAMB.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", sfProRounded.variable, serif.variable)}
    >
      <body>
        <ThemeProvider>
          <SessionProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
