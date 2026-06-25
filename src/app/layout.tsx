import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewLoop AI — Get more 5-star reviews without chasing customers",
  description:
    "Send review requests, draft professional replies, catch unhappy customers early, and turn great reviews into social proof.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
