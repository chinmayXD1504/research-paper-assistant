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
        palette: {
          linen: "#EFEEEE",
          sand: "#E9CCB1",
          taupe: "#D3C4BE",
          khaki: "#E4DAC2",
          ivory: "#F4EEE1",
          stone: "#C4BDAC",
          blush: "#EBCFC4",
          oat: "#E8E6D9",
          gray: "#999999",
          cashmere: "#F3ECE7",
          // Dark ink tones for high contrast typography
          ink: "#1c1917",
          charcoal: "#292524",
          muted: "#57534e",
        }
      },
      boxShadow: {
        'paper-sm': '0 1px 3px 0 rgba(41, 37, 36, 0.05), 0 1px 2px -1px rgba(41, 37, 36, 0.05)',
        'paper-md': '0 4px 6px -1px rgba(41, 37, 36, 0.07), 0 2px 4px -2px rgba(41, 37, 36, 0.05)',
        'paper-lg': '0 10px 15px -3px rgba(41, 37, 36, 0.08), 0 4px 6px -4px rgba(41, 37, 36, 0.04)',
        'sand-glow': '0 0 20px -3px rgba(233, 204, 177, 0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
