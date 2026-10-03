/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Тёмная тема по системной настройке; атрибут data-theme="light|dark" на <html> её переопределяет
  darkMode: [
    "variant",
    ["@media (prefers-color-scheme: dark) { &:not([data-theme=light] *) }", "&:is([data-theme=dark] *)"],
  ],
  theme: { extend: {} },
  plugins: [],
};
