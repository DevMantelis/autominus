import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { HeroUIProvider } from "@heroui/system";
import Header from "../components/header/header";
import { ConvexClientProvider } from "../providers/ConvexClientProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Autominus",
  description: "Autominus - auto scraping platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HeroUIProvider>
          <ConvexClientProvider>
            <NuqsAdapter>
              <Header />
              {children}
            </NuqsAdapter>
          </ConvexClientProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
