/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f6fb',
          100: '#e6eef7',
          200: '#c9dced',
          300: '#9fc1df',
          400: '#6d9fca',
          500: '#3e75a7',
          600: '#245886',
          700: '#123b66',
          800: '#0a2340',
          900: '#06172b',
        },
        accent: {
          50: '#fdf1f1',
          100: '#fbe3e3',
          500: '#d64545',
          600: '#c03636',
          700: '#9d2b2b',
        },
        sun: {
          50: '#fffaeb',
          100: '#fdf3d3',
          400: '#f6d666',
          500: '#f2c94c',
          600: '#d9ae2f',
        },
        ink: '#101828',
        paper: '#fbfcfe',
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -18px rgba(10, 35, 64, 0.22)',
        card: '0 18px 55px -30px rgba(10, 35, 64, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
        'soft-pulse': 'soft-pulse 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
