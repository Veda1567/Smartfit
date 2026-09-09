import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // athletic emerald
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        slate: {
          850: "#172033",
          900: "#0f172a",
          950: "#080c15",
        }
      },
    },
  },
  plugins: [],
};

export default config;
