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
        pink: {
          light: '#FFF0F7',
          DEFAULT: '#FF69B4',
          dark: '#DB2777'
        },
        dark: {
          DEFAULT: '#000000',
          'gray-1': '#121212',
          'gray-2': '#1D1D1D',
          'gray-3': '#2D2D2D',
          'gray-4': '#343434',
          text: {
            primary: '#FFFFFF',
            secondary: '#A8A8A8',
          }
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        borp: {
          primary: '#E85B55',
          secondary: '#FF6B6B',
          accent: '#FFE4E4',
          hover: '#FF8080',
          dark: {
            DEFAULT: '#1A1A1A',
            lighter: '#2A2A2A',
            accent: '#3A3A3A',
          },
          text: {
            primary: '#333333',
            secondary: '#666666',
            light: '#FFFFFF',
          }
        }
      },
      keyframes: {
        'float-heart': {
          '0%': { transform: 'translateY(0) scale(0) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(-500px) scale(1) rotate(45deg)', opacity: 0 },
        },
        'heart-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.25)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        'fade-out-up': {
          '0%': { transform: 'translateY(0)', opacity: 1 },
          '100%': { transform: 'translateY(-10px)', opacity: 0 },
        },
        'fade-in-up': {
          '0%': { transform: 'translateY(0)', opacity: 0 },
          '100%': { transform: 'translateY(-10px)', opacity: 1 },
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg) translateX(32px) rotate(0deg)' },
          '50%': { transform: 'rotate(180deg) translateX(32px) rotate(-180deg)' },
          '100%': { transform: 'rotate(360deg) translateX(32px) rotate(-360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'dialog-show': {
          '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(0.96)' },
          '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        }
      },
      animation: {
        'float-heart': 'float-heart 1.5s ease-out forwards',
        'heart-pulse': 'heart-pulse 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.3s ease-out forwards',
        'fade-out-up': 'fade-out-up 0.3s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.3s ease-out forwards',
        'orbit': 'orbit 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'orbit-delayed': 'orbit 2s cubic-bezier(0.4, 0, 0.2, 1) infinite -1s',
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideIn: 'slideIn 0.3s ease-in-out',
        'dialog-show': 'dialog-show 0.2s ease-out',
        shake: 'shake 0.3s ease-in-out',
      },
    },
  },
  plugins: [
    import('tailwindcss-animate'),
    import('@tailwindcss/typography')
  ],
}