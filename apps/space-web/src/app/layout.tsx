import React from 'react';
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import AppShell from "@/components/AppShell";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Toaster position="top-right" richColors />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
