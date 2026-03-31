/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        leap: {
          purple: '#6366F1',
          'purple-light': '#EEF2FF',
          yellow: '#F59E0B',
          'yellow-light': '#FEF3C7',
          green: '#10B981',
          'green-light': '#ECFDF5',
          pink: '#EC4899',
          'pink-light': '#FCE7F3',
          red: '#EF4444',
          coral: '#FF6B6B',
          sky: '#38BDF8',
        },
      },
      animation: {
        'float-up': 'floatUp 4s ease-out forwards',
        'pop': 'pop 0.3s ease-out forwards',
        'star-burst': 'starBurst 3s ease-out forwards',
        'confetti-fall': 'confettiFall 4s ease-in forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'badge-flash': 'badgeFlash 2s ease-out forwards',
        'pulse-glow': 'pulseGlow 1s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'wave': 'wave 0.5s ease-in-out',
      },
      keyframes: {
        floatUp: {
          '0%': { transform: 'translateY(100vh) scale(0.8)', opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translateY(-20vh) scale(1)', opacity: '0' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        starBurst: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '60%': { opacity: '1' },
          '100%': { transform: 'scale(2) rotate(180deg)', opacity: '0' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: '0' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(120%)', opacity: '0' },
          '80%': { transform: 'translateX(-10px)' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        badgeFlash: {
          '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '20%': { transform: 'scale(1.3) rotate(5deg)', opacity: '1' },
          '40%': { transform: 'scale(1) rotate(0deg)' },
          '70%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
          '50%': { boxShadow: '0 0 0 20px rgba(99, 102, 241, 0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(20deg)' },
          '75%': { transform: 'rotate(-20deg)' },
        },
      },
    },
  },
  plugins: [],
};
