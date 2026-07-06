import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SID.AI",
  description: "Your Personal AI Assistant",
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "48x48" },
    { rel: "icon", url: "/favicon.png", sizes: "96x96", type: "image/png" },
  ],
  openGraph: {
    title: "SID.AI",
    description: "Your Personal AI Assistant",
    images: ["/sid-ai-logo-v2.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
