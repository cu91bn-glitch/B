/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'sans-serif'],
        cairo: ['Tajawal', 'sans-serif'],
      },
      colors: {
        // نصوص أغمق لوضوح القراءة
        slate: {
          50: '#f6f9fb', 100: '#eef3f7', 200: '#dde6ee', 300: '#c2cfdb', 400: '#5f7385',
          500: '#4a5d6e', 600: '#3a4c5c', 700: '#2b3b4a', 800: '#1b2a38', 900: '#0f1c28', 950: '#08121b',
        },
        // ألوان الهوية: أزرق فاتح + أخضر
        brand: {
          50: '#effaff', 100: '#d9f2fd', 200: '#b3e5f9', 300: '#7dd1f2', 400: '#3cb6e6',
          500: '#1e9bd0', 600: '#1E88C7', 700: '#0e6f9e', 800: '#10567a', 900: '#10324a',
        },
        leaf: {
          50: '#effbf3', 100: '#d8f4e1', 200: '#b3e8c6', 300: '#80d5a2', 400: '#4dbb7b',
          500: '#2e9e5b', 600: '#23834a', 700: '#1f683d', 800: '#1c5333', 900: '#18442b',
        },
        indigo: {
          50: '#effaff', 100: '#d9f2fd', 200: '#b3e5f9', 300: '#7dd1f2', 400: '#3cb6e6',
          500: '#1e9bd0', 600: '#1E88C7', 700: '#0e6f9e', 800: '#10567a', 900: '#10324a',
        },
        emerald: {
          DEFAULT: '#059669',
        },
        amber: {
          DEFAULT: '#D97706',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
