
// Было: import { Geist, Geist_Mono } from "next-font/google";
import { Geist, Geist_Mono } from "next/font/google"; // ИСПРАВЛЕНО

import '@/app/globals.css';
import { SessionProvider } from "next-auth/react"; // 1. Импортируем провайдер

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://bandbooster.com'
  ),
  title: "BandBooster | AI IELTS Writing Checker & Examiner",
  description: "Improve your IELTS Writing score with AI...",
  // ... остальные метаданные
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 2. Оборачиваем все приложение, чтобы useSession заработал в Navbar */}
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
