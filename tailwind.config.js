/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Rajdhani', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // NeoTech Brand Palette — derived from logo
        brandRed:      '#D42B2B',   // Primary: logo circle fill
        brandRedDark:  '#A01E1E',   // Deeper red: shadow/hover
        brandRedGlow:  '#FF3030',   // Accent: glow/energy state
        brandChrome:   '#C8C8D4',   // Chrome silver: "N" letterform
        brandSilver:   '#9898A8',   // Muted silver: secondary text
        brandBg:       '#0E0E10',   // Deep background
        brandSurface:  '#161618',   // Card surface
        brandSurface2: '#1E1E22',   // Input/secondary surface
        brandBorder:   '#2A2A30',   // Subtle borders
        brandText:     '#E8E8F0',   // Primary text
        brandMuted:    '#707080',   // Muted/placeholder text
        // Legacy aliases (kept for components not yet redesigned)
        brandDark:     '#161618',
        brandBlack:    '#0E0E10',
        brandGreen:    '#D42B2B',   // redirect green refs to red
        brandLime:     '#FF3030',   // redirect lime refs to red glow
        brandYellow:   '#F0A500',
      },
      animation: {
        'fade-in-up':    'fadeInUp 0.5s ease-out forwards',
        'fade-in':       'fadeIn 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-glow':    'pulseGlow 2.5s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'circuit-pulse': 'circuitPulse 3s ease-in-out infinite',
        'spin-slow':     'spin 8s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5', boxShadow: '0 0 0 0 rgba(212,43,43,0)' },
          '50%':      { opacity: '1',   boxShadow: '0 0 20px 4px rgba(212,43,43,0.35)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to:   { backgroundPosition: '-200% 0' },
        },
        circuitPulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%':      { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'circuit-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M10 10 h10 v10 h10 M40 10 h10 v10 h-10 M10 40 h10 v10 h10 M40 40 h10 v10 h-10' stroke='%23D42B2B' stroke-width='0.5' fill='none' opacity='0.15'/%3E%3Ccircle cx='10' cy='10' r='2' fill='%23D42B2B' opacity='0.2'/%3E%3Ccircle cx='50' cy='10' r='2' fill='%23D42B2B' opacity='0.2'/%3E%3Ccircle cx='10' cy='50' r='2' fill='%23D42B2B' opacity='0.2'/%3E%3Ccircle cx='50' cy='50' r='2' fill='%23D42B2B' opacity='0.2'/%3E%3C/svg%3E\")",
        'red-gradient': 'linear-gradient(135deg, #D42B2B 0%, #A01E1E 100%)',
        'dark-gradient': 'linear-gradient(135deg, #161618 0%, #0E0E10 100%)',
      },
      boxShadow: {
        'red-sm':  '0 2px 8px rgba(212,43,43,0.25)',
        'red-md':  '0 4px 20px rgba(212,43,43,0.35)',
        'red-lg':  '0 8px 40px rgba(212,43,43,0.45)',
        'red-glow': '0 0 30px rgba(212,43,43,0.4)',
        'chrome':  '0 4px 20px rgba(200,200,212,0.1)',
      },
    },
  },
  plugins: [],
}
