/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Добавляем эту строку, чтобы темная тема работала через классы
  darkMode: 'class', 
  
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Здесь могут быть ваши настройки цветов и шрифтов
    },
  },
  plugins: [],
};

