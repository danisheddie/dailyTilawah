/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF9F6',
        teal: '#1B4F72',
        gold: '#C9A84C',
        muted: '#6B7280',
      },
      fontFamily: {
        arabic: ['Amiri', 'serif'],
        // Qur'anic text: official Madani mushaf face, then graceful fallbacks.
        quran: [
          '"KFGQPC Uthmanic Script HAFS"',
          '"Amiri Quran"',
          'Amiri',
          'serif',
        ],
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
