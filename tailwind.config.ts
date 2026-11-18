import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f1f7f2",
          100: "#dcebe0",
          200: "#b9d7c1",
          300: "#8cbb99",
          400: "#5f9a70",
          500: "#3f7d53",
          600: "#2f6641",
          700: "#265336",
          800: "#20422c",
          900: "#1a3624",
          950: "#0d1e13",
        },
        clay: {
          50: "#fdf3ee",
          100: "#fbe3d6",
          200: "#f6c4a8",
          300: "#f09e72",
          400: "#e97941",
          500: "#dc5d24",
          600: "#bd471a",
          700: "#973619",
          800: "#7a2d1a",
          900: "#652718",
        },
        sand: "#f7f4ee",
        ink: "#1c2320",
      },
      fontFamily: {
        display: ["var(--font-display, Georgia)", "Georgia", "serif"],
        sans: ["var(--font-sans, ui-sans-serif)", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
