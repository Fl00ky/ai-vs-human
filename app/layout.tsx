import type { Metadata } from "next";
import { Share_Tech_Mono, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import { SoundProvider } from "@/components/sound/SoundProvider";
import { LanguageProvider, GlobalLanguageSwitcher } from "@/lib/i18n/context";
import "./globals.css";

const techMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "aivshuman :: choose your side",
  description: "AI vs Human — pick a side in the race that decides everything.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${techMono.variable} ${jetMono.variable}`}>
      <body className="crt-overlay">
        <LanguageProvider>
          <SoundProvider>
            <ToastProvider>
              {children}
              <GlobalLanguageSwitcher />
            </ToastProvider>
          </SoundProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
