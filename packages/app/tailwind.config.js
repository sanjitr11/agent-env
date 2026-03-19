/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        surface: {
          base:    '#0c0c0e',
          raised:  '#141417',
          overlay: '#1c1c22',
          border:  '#26262f',
        },
        accent: {
          DEFAULT: '#7c5af6',
          hover:   '#6b49e0',
          muted:   '#1e1a30',
          text:    '#a78bfa',
        },
        ink: {
          DEFAULT: '#ededf0',
          2:       '#9999aa',
          3:       '#55556a',
        },
      },
    },
  },
  plugins: [],
}
