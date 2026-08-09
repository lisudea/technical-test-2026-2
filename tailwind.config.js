/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6CBCB9',
          dark: '#3E7F7C',
          50: '#F0F8F8',
          100: '#D9EDEC',
          200: '#B3DAD8',
          300: '#8CC9C7',
          400: '#6CBCB9',
          500: '#4FABAA',
          600: '#3E7F7C',
          700: '#316562',
          800: '#244B49',
          900: '#17322F',
        },
        ink: {
          DEFAULT: '#1F2D3D',
          soft: '#3E4D5D',
          muted: '#6B7886',
        },
        surface: {
          DEFAULT: '#F7F9F9',
          card: '#FFFFFF',
          line: '#E3E8E8',
        },
        state: {
          disponible: '#3E8E5B',
          reservado: '#C4544A',
          mantenimiento: '#8A94A6',
          warning: '#D9A441',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(31, 45, 61, 0.06), 0 1px 2px rgba(31, 45, 61, 0.04)',
        soft: '0 4px 12px rgba(31, 45, 61, 0.08)',
        ring: '0 0 0 4px rgba(108, 188, 185, 0.18)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s smooth',
        'slide-up': 'slide-up 0.3s smooth',
      },
    },
  },
  plugins: [],
};
