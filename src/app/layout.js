import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Providers } from "../components/Providers";
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
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

// // Было: import { Geist, Geist_Mono } from "next-font/google";
// import { Geist, Geist_Mono } from "next/font/google"; // ИСПРАВЛЕНО

// import './globals.css';
// //import { SessionProvider } from "next-auth/react"; // 1. Импортируем провайдер

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata = {
//   metadataBase: new URL(
//     process.env.NODE_ENV === 'development' 
//       ? 'http://localhost:3000' 
//       : 'https://bandbooster.com'
//   ),
//   title: "BandBooster | AI IELTS Writing Checker & Examiner",
//   description: "Improve your IELTS Writing score with AI...",
//   // ... остальные метаданные
// };

// export const viewport = {
//   themeColor: "#4f46e5",
//   width: "device-width",
//   initialScale: 1,
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
//         {/* 2. Оборачиваем все приложение, чтобы useSession заработал в Navbar */}
//         {/* <SessionProvider>
//           {children}
//         </SessionProvider> */}
//       </body>
//     </html>
//   );
// }
