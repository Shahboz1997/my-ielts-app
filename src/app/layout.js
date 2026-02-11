import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 1. Настройка шрифтов
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Единая настройка Metadata (Объединил оба  блока)

export const metadata = {
  // 1. Добавляем базовый URL (убирает предупреждение в консоли)
  metadataBase: new URL(
    process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://bandbooster.com' // замените на ваш реальный домен позже
  ),
  
  title: "BandBooster | AI IELTS Writing Checker & Examiner",
  description: "Improve your IELTS Writing score with AI...",
  keywords: ["IELTS Writing AI", "IELTS checker", "AI essay grader"],
  
  // 2. Улучшенная настройка иконок
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.ico", type: "image/x-icon" }, // для старых браузеров
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    title: "BandBooster - Get Your IELTS Band Score Instantly",
    description: "AI-powered platform to check your IELTS essays...",
    url: "https://bandbooster.com",
    siteName: "BandBooster AI",
    images: [
      {
        url: "/og-image.png", // Теперь Next.js сам превратит это в полный URL
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

// 3. Настройка Viewport
export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 4. RootLayout (Экспортируется в конце)
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        {children}
      </body>
    </html>
  );
}
