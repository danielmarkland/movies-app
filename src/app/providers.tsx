"use client"

import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@radix-ui/react-tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )
}
