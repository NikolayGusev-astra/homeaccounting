import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Домашняя бухгалтерия",
  description: "Управление личными финансами с прогнозированием кассовых разрывов. Учет доходов и расходов, планирование бюджета, аналитика.",
  keywords: ["бухгалтерия", "финансы", "бюджет", "доходы", "расходы", "учет", "планирование"],
  authors: [{ name: "Home Accounting" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Домашняя бухгалтерия",
    description: "Управление личными финансами с прогнозированием кассовых разрывов",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://homeaccounting.ru",
    siteName: "Домашняя бухгалтерия",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Домашняя бухгалтерия",
    description: "Управление личными финансами с прогнозированием кассовых разрывов",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
