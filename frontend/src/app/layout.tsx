import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Z-GATE Academy Online",
  description: "Practical courses built from real Advisory casework.",
  // Not public yet - keep the skeleton out of search results.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
