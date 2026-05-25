"use client";

import { Toaster as SonnerToaster } from "sonner";

import { useTheme } from "@/components/providers/theme-provider";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SonnerToaster
      theme={resolvedTheme}
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group !rounded-xl !border !border-border !bg-card !text-foreground !shadow-[var(--shadow-pop)]",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
