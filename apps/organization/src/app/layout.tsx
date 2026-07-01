import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@repo/ui";
import { Frame } from "@/components/layout/frame";
import { QueryProvider } from "@/components/providers/query-provider";
import { appClient } from "@/lib/api";

async function getAppMeta(): Promise<{
  name: string;
  favicon?: string | null;
}> {
  try {
    const res = await appClient.api.applications.current.$get();
    if (!res.ok) return { name: "Organization" };
    const app = await res.json();
    return { name: app.name ?? "Organization", favicon: app.favicon };
  } catch {
    return { name: "Organization" };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { name, favicon } = await getAppMeta();
  return {
    title: { template: `%s | ${name}`, default: name },
    description: "Organization portal",
    ...(favicon ? { icons: { icon: [{ url: favicon }] } } : {}),
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
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Toaster richColors position="top-center" />
            <QueryProvider>
              <Frame>{children}</Frame>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
