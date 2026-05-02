import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/modules/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        spark: {
          DEFAULT: "#FF8A4C",
          deep: "#E07238",
          glow: "rgba(255, 138, 76, 0.20)",
        },
        nova: {
          DEFAULT: "var(--color-nova)",
          hover: "var(--color-nova-hover)",
          soft: "var(--color-nova-soft)",
          strong: "var(--color-nova-strong)",
        },
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Segoe UI Variable",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        // Display sizes for hero text — Gemini-inspired
        "display-xl": ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "300" }],
        "display-lg": ["3rem", { lineHeight: "1.08", letterSpacing: "-0.028em", fontWeight: "300" }],
        "display-md": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "400" }],
      },
      borderRadius: {
        xl: "20px",
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
        lift: "0 4px 12px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.06)",
        glow: "0 0 0 1px rgba(255,138,76,0.18), 0 8px 32px rgba(255,138,76,0.16)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 320ms cubic-bezier(0.34, 1.4, 0.64, 1) both",
        "scale-in": "scale-in 220ms cubic-bezier(0.34, 1.4, 0.64, 1) both",
      },
      backgroundImage: {
        "gradient-nova": "var(--gradient-nova)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.4, 0.64, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
