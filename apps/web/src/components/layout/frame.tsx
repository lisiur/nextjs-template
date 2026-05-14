"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { Loader } from "@/lib/loading";

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      scriptProps={{ type: "application/json" }}
    >
      <Loader />
      <Toaster
        richColors
        position="top-center"
        toastOptions={{
          classNames: {
            closeButton: "!right-0 !left-auto !translate-x-1/2",
          },
        }}
      />
      <div className="h-[100vh] flex flex-col">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      </div>
    </ThemeProvider>
  );
}
