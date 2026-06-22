import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#effaf3",
          100: "#d8f3e0",
          200: "#b3e6c5",
          300: "#80d2a3",
          400: "#48b67c",
          500: "#22995f",
          600: "#157a4c",
          700: "#11613e",
          800: "#104d33",
          900: "#0d3f2b",
          950: "#062318",
        },
        ink: {
          900: "#0a0e14",
          850: "#0e131c",
          800: "#121826",
          750: "#161d2e",
          700: "#1c2436",
          600: "#283145",
          500: "#3a4661",
          400: "#5b6885",
          300: "#8b97b3",
          200: "#b9c2d8",
        },
        accent: {
          DEFAULT: "#3ddc84",
          gold: "#f5c542",
          loss: "#ff5d6c",
          win: "#3ddc84",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(61,220,132,0.25), 0 8px 30px rgba(0,0,0,0.35)",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pop: {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "60%": { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        pop: "pop 0.22s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
