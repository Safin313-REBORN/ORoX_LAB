/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'clay-card': 'inset -4px -4px 10px rgba(0, 0, 0, 0.45), inset 4px 4px 10px rgba(255, 255, 255, 0.08), 8px 12px 28px rgba(0, 0, 0, 0.45)',
        'clay-card-sm': 'inset -2px -2px 6px rgba(0, 0, 0, 0.4), inset 2px 2px 6px rgba(255, 255, 255, 0.08), 4px 6px 14px rgba(0, 0, 0, 0.35)',
        'clay-btn': 'inset -2px -2px 6px rgba(0, 0, 0, 0.35), inset 2px 2px 6px rgba(255, 255, 255, 0.18), 3px 5px 12px rgba(0, 0, 0, 0.35)',
        'clay-btn-hover': 'inset -2px -2px 6px rgba(0, 0, 0, 0.25), inset 2px 2px 6px rgba(255, 255, 255, 0.25), 4px 8px 18px rgba(0, 0, 0, 0.45)',
        'clay-btn-active': 'inset 3px 3px 6px rgba(0, 0, 0, 0.55), inset -2px -2px 5px rgba(255, 255, 255, 0.06), 1px 2px 4px rgba(0, 0, 0, 0.3)',
        'clay-pill': 'inset -2px -2px 5px rgba(0, 0, 0, 0.3), inset 2px 2px 5px rgba(255, 255, 255, 0.12), 3px 3px 8px rgba(0, 0, 0, 0.25)',
        'clay-inner': 'inset 3px 3px 8px rgba(0, 0, 0, 0.5), inset -3px -3px 8px rgba(255, 255, 255, 0.05)',
        'clay-cyan': 'inset -2px -2px 6px rgba(0, 0, 0, 0.4), inset 2px 2px 6px rgba(255, 255, 255, 0.3), 0 0 18px rgba(6, 182, 212, 0.45)',
        'clay-emerald': 'inset -2px -2px 6px rgba(0, 0, 0, 0.4), inset 2px 2px 6px rgba(255, 255, 255, 0.3), 0 0 18px rgba(16, 185, 129, 0.45)',
        'clay-rose': 'inset -2px -2px 6px rgba(0, 0, 0, 0.4), inset 2px 2px 6px rgba(255, 255, 255, 0.3), 0 0 18px rgba(244, 63, 94, 0.45)',
        'clay-chip': 'inset -3px -3px 8px rgba(0, 0, 0, 0.6), inset 3px 3px 8px rgba(255, 255, 255, 0.12), 6px 10px 24px rgba(0, 0, 0, 0.55)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
