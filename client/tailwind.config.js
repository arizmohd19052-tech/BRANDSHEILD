/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Sarvam.ai Inspired Mature Palette
        brand: {
          bg: {
            light: '#F7F5F0',
            dark: '#0B1118',
          },
          surface: {
            light: '#FFFFFF',
            dark: '#121B25',
          },
          ink: {
            light: '#0F1B2D',
            dark: '#E8EDF2',
          },
          muted: {
            light: '#5B6675',
            dark: '#8B97A7',
          },
          border: {
            light: '#E3DFD6',
            dark: '#243140',
          },
          primary: {
            DEFAULT: '#0E5A52', // Deep Teal-Green
            hover: '#0A443E',
            light: '#E6F0EE',
            dark: '#0E5A52',
          },
          accent: {
            DEFAULT: '#C8791A', // Warm Amber
            hover: '#A96312',
            light: '#FDF4E9',
          },
        },
        // Semantic Risk Colours (Paired with icon & text)
        risk: {
          critical: {
            DEFAULT: '#B3261E',
            bg: '#FDF2F2',
            darkBg: '#2E100F',
            border: '#F8B4B4',
          },
          high: {
            DEFAULT: '#D9622B',
            bg: '#FDF5F0',
            darkBg: '#34160C',
            border: '#F7C6B0',
          },
          medium: {
            DEFAULT: '#C99A1F',
            bg: '#FEF9EC',
            darkBg: '#332709',
            border: '#F6DF9C',
          },
          low: {
            DEFAULT: '#2E7D5B',
            bg: '#F0F9F5',
            darkBg: '#0A261A',
            border: '#A8DBC5',
          },
          verified: {
            DEFAULT: '#1F6F8B',
            bg: '#F0F7FA',
            darkBg: '#0B242F',
            border: '#A2D0E0',
          },
        },
        // Module Accents (No Purple)
        module: {
          lab: {
            DEFAULT: '#3B5B8C', // Steel Blue
            light: '#EBF1F9',
            dark: '#273C5E',
          },
          brand: {
            DEFAULT: '#0E5A52',
            light: '#E6F0EE',
          },
          social: {
            DEFAULT: '#1F6F8B',
            light: '#F0F7FA',
          },
          appstore: {
            DEFAULT: '#C8791A',
            light: '#FDF4E9',
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-stagger': 'fadeStagger 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'radar-sweep': 'radarSweep 2s linear infinite',
        'count-up': 'countUp 0.4s ease-out forwards',
        'gauge-fill': 'gaugeFill 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeStagger: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
