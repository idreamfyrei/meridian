import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian",
  description: "A keyboard-first email and calendar command center.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased">
        <body className="flex min-h-full flex-col">
          <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-6">
            <Link href="/" className="text-sm font-semibold">
              Meridian
            </Link>

            <nav className="flex items-center gap-3 text-sm">
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton />
              </Show>

              <Show when="signed-in">
                <UserButton />
              </Show>
            </nav>
          </header>

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
