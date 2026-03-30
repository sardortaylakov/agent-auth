import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Auth Demo",
  description: "Auth0 AI + OpenClaw — Secure AI agents with Token Vault and Human-in-the-Loop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
