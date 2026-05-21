/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#1e1e2e',
          surface: '#181825',
          overlay: '#11111b',
          panel: '#1e1e2e',
          border: '#313244',
          hover: '#45475a',
          active: '#585b70',
          text: '#cdd6f4',
          subtext: '#a6adc8',
          muted: '#6c7086',
          accent: '#89b4fa',
          accentHover: '#74c7ec',
          success: '#a6e3a1',
          warning: '#f9e2af',
          error: '#f38ba8',
          info: '#89dceb',
        },
        sidebar: {
          bg: '#11111b',
          hover: '#1e1e2e',
          active: '#313244',
          text: '#cdd6f4',
          icon: '#6c7086',
          iconActive: '#89b4fa',
        },
        tab: {
          bg: '#181825',
          active: '#1e1e2e',
          border: '#313244',
          text: '#a6adc8',
          textActive: '#cdd6f4',
        },
        terminal: {
          bg: '#11111b',
          text: '#cdd6f4',
          border: '#313244',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(137, 180, 250, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(137, 180, 250, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
