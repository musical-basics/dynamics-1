import type { Metadata } from "next";
import MiniPlayer from "@/components/player/MiniPlayer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dynamics.art — Where Sound Meets Artistry",
  description:
    "A high-fidelity music platform that respects dynamic range. No limiters, no compression — just pure sound.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <MiniPlayer />
      </body>
    </html>
  );
}
