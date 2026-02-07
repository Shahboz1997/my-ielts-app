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

// 2. Правильная настройка Metadata (без themeColor)
// export const metadata = {
//   title: "IELTS PEAK PRO",
//   description: "AI-powered IELTS Writing Examiner",
//   manifest: "/manifest.json",
//   appleWebApp: {
//     capable: true,
//     statusBarStyle: "default",
//     title: "IELTS Peak",
//   },
// };

// 3. Настройка Viewport (исправляет ваши предупреждения)
export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 4. Единая функция RootLayout
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
// export const metadata = {
//   title: "BandBooster | AI IELTS Writing Checker & Examiner",
//   description: "Improve your IELTS Writing score with AI. Instant band score, grammar check, and band 8.0+ rewriting for Task 1 and Task 2.",
//   keywords: ["IELTS Writing AI", "IELTS checker", "AI essay grader", "IELTS practice online", "BandBooster"],
//   openGraph: {
//     title: "BandBooster - Get Your IELTS Band Score Instantly",
//     description: "AI-powered platform to check your IELTS essays against official descriptors.",
//     url: "https://your-domain.com",
//     siteName: "BandBooster AI",
//     images: [
//       {
//         url: "/og-image.png", // Загрузи картинку в папку public для превью в соцсетях
//         width: 1200,
//         height: 630,
//       },
//     ],
//     locale: "en_US",
//     type: "website",
//   },
// };
export const metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://your-domain.com' // Замените на ваш реальный домен позже
  ),
  title: 'BandBooster PRO',
  description: 'AI IELTS Writing Assistant',
};

