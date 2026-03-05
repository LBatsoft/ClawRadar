import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ClawRadar - OpenClaw 生态项目热度追踪",
  description: "追踪 OpenClaw 生态中所有开源项目的星标增长、贡献者活跃度和代码提交趋势",
  keywords: ["OpenClaw", "GitHub", "开源", "排行榜", "数据分析"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
