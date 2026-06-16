import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grad Party 2026",
  description: "Graduation party checklist and Saturday run-sheet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
