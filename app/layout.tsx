import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getServerLocale } from "@/lib/server-i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();

  return locale === "en"
    ? {
        title: "Larry Academy - Future Learning Platform",
        description:
          "A student-built learning platform for the AI era, using video, interactive practice, games, and future 3D tools to inspire unlimited potential.",
      }
    : {
        title: "Larry Academy - 创新学习平台",
        description:
          "一个由学生亲手创造、面向未来的综合学习平台，用 AI、视频、互动练习、游戏和未来 3D 工具激发无限潜能。",
      };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale === "en" ? "en" : "zh-CN"}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh w-full max-w-[100vw] overflow-x-clip antialiased`}
      >
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
