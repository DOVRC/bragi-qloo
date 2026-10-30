import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bragi: {
          ink: "#101828",
          slate: "#1D2939",
          mist: "#C7CEEB",
          paper: "#F0F2FA",
          clay: "#8B7355",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "grain-shift": {
          "0%": { transform: "translate(0,0)" },
          "100%": { transform: "translate(-2%, -2%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "grain-shift": "grain-shift 8s linear infinite alternate",
      },
    },
  },
  plugins: [],
};

export default config;
