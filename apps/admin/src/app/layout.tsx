import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@repo/ui";
import { Frame } from "@/components/layout/frame";
import { QueryProvider } from "@/components/providers/query-provider";
import { appClient } from "@/lib/api/app-client";
import { Loader } from "@/lib/loading";

async function getAppName(): Promise<string> {
  try {
    const res = await appClient.api.applications.current.$get();
    if (!res.ok) return "Admin";
    const app = await res.json();
    return app.name ?? "Admin";
  } catch {
    return "Admin";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const name = await getAppName();
  return {
    title: { template: `%s | ${name}`, default: name },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const locale = store.get("locale")?.value || "en";

  return (
    <html
      lang={locale}
      className={cn("h-full antialiased", "font-sans")}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
            <QueryProvider>
              <Frame>{children}</Frame>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
