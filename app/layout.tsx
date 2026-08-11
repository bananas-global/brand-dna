import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);

  return {
    metadataBase: baseUrl,
    title: "Brand DNA — Template mestre",
    description: "Uma fonte de verdade de marca para pessoas e agentes.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Brand DNA — Template mestre",
      description: "Uma fonte de verdade de marca para pessoas e agentes.",
      images: [{ url: new URL("/og.png", baseUrl).toString(), width: 1200, height: 630, alt: "Brand DNA — fonte de verdade para pessoas e agentes" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Brand DNA — Template mestre",
      description: "Uma fonte de verdade de marca para pessoas e agentes.",
      images: [new URL("/og.png", baseUrl).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
