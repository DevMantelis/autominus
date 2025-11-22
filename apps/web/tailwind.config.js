// tailwind.config.js
import {heroui} from "@heroui/theme"
import {darkTheme, lightTheme} from "./app/theme"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      // light: {colors: lightTheme},
      // dark: {colors: darkTheme}
    }
  })],
};