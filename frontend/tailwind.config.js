/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#f8fafc',
          card: '#ffffff',
          elevated: '#f1f5f9'
        },
        accent: {
          cyan: '#3b82f6', // blue
          green: '#10b981', // green
          amber: '#f59e0b', // orange
          red: '#ef4444', // red
          purple: '#8b5cf6' // purple
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
