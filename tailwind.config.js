/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0C73FE',
          hover: '#0A5FD4',
          light: '#EBF3FF',
          dark: '#0050B3',
        },
        ink: {
          900: '#1A1E27',
          600: '#5A6478',
          400: '#9BA3B2',
          200: '#D9DCE3',
          100: '#EEF0F3',
          50: '#F5F7FA',
        },
        orange: {
          DEFAULT: '#FF6D00',
          light: '#FFF3E8',
        },
        success: {
          DEFAULT: '#00C176',
          light: '#E6FAF3',
        },
        danger: {
          DEFAULT: '#F5222D',
          light: '#FFF1F0',
        },
        warning: {
          DEFAULT: '#FAAD14',
        },
        gold: '#D4AF37',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        chip: '8px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(12,115,254,0.12)',
        btn: '0 4px 12px rgba(12,115,254,0.30)',
        dropdown: '0 8px 32px rgba(0,0,0,0.12)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'slide-out-top': {
          '0%': { opacity: '0', transform: 'translateY(-16px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'dash': {
          to: { strokeDashoffset: '-24' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        'fade-in': 'fade-in 200ms ease',
        'modal-in': 'modal-in 200ms ease',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
        'slide-out-top': 'slide-out-top 300ms ease',
        dash: 'dash 1s linear infinite',
      },
    },
  },
  plugins: [],
}
