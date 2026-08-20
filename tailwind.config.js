/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Themeable via CSS variables (see index.css). Channels are space-
        // separated RGB so Tailwind's /opacity modifiers keep working.
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        teal: 'rgb(var(--c-teal) / <alpha-value>)',
        gold: 'rgb(var(--c-gold) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
      },
      fontFamily: {
        arabic: ['Amiri', 'serif'],
        // Qur'anic text for the ayah-list view: the official KFGQPC Uthmanic
        // Hafs face, paired with quran.com's matching `text_uthmani`, so tajwīd
        // marks render as the printed Madani mushaf. Amiri Quran is a fallback.
        quran: [
          '"KFGQPC Uthmanic Script HAFS"',
          '"Amiri Quran"',
          'Amiri',
          'serif',
        ],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // The app uses exactly three corner radii. Overriding these keeps the
      // existing utility names but standardizes their values:
      //   rounded-lg  = 8px   (small: chips, inputs, icon buttons)
      //   rounded-xl  = 14px  (standard: cards, rows, buttons)
      //   rounded-2xl = 20px  (large/special: hero, sheets, medallions)
      borderRadius: {
        lg: '8px',
        xl: '14px',
        '2xl': '20px',
      },
      boxShadow: {
        // One soft, restrained elevation — no heavy drop shadows.
        card: '0 1px 2px rgb(var(--c-teal) / 0.04), 0 6px 20px rgb(var(--c-teal) / 0.04)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'scale-in': 'scale-in 0.45s ease-out',
      },
    },
  },
  plugins: [],
}
