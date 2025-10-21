import { Inter } from "next/font/google";

import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RemoteJobs - Find Your Dream Remote Work",
  description:
    "Aggregated remote work opportunities from top platforms worldwide. Browse thousands of remote jobs in tech, design, marketing, and more.",
  keywords: ["remote jobs", "work from home", "remote work", "freelance", "digital nomad"],
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html lang={locale || "en"} suppressHydrationWarning>
        <body className={`${inter.className} flex min-h-screen flex-col`}>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
