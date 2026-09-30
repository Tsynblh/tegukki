import type { Metadata } from "next";
import { Outfit, Merriweather, JetBrains_Mono } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tegukki — POS & Inventory",
  description: "Web POS dan Inventory Management Toko Tumbler Tegukki",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="id"
      className={`${outfit.variable} ${merriweather.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased bg-background text-foreground font-sans">
        <div id="app-root" className="min-h-screen flex flex-col">
          <Navbar currentUser={user} />
          <div className="flex-1 flex flex-col">{children}</div>
        </div>
        <div id="receipt-portal-root" />
      </body>
    </html>
  );
}
