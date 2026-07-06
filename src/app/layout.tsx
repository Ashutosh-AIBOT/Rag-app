import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Advanced RAG Platform",
  description: "Hybrid search, re-ranking, multi-strategy retrieval & RAG evaluation",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${mono.variable} min-h-screen bg-zinc-950 text-zinc-50 antialiased`}>
        <Providers>
          <Navbar />
          <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
