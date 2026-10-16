import type { Config } from 'tailwindcss';
const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;
export default {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    container: { center: true, padding: { DEFAULT: '16px', md: '24px', xl: '40px' }, screens: { '2xl': '1440px' } },
    extend: {
      colors: { ink: c('ink'), paper: c('paper'), surface: c('surface'), 'surface-2': c('surface-2'), line: c('line'), muted: c('muted'), accent: c('accent'), ok: c('ok'), wa: c('wa'), 'ink-fixed': '#0B0B0B' },
      fontFamily: { sans: ['var(--font-sans)'] },
      borderRadius: { DEFAULT: 'var(--radius)' },
      aspectRatio: { card: '4 / 5' },
      transitionTimingFunction: { out: 'var(--ease-out)' },
      keyframes: { shimmer: { from: { backgroundPosition: '150% 0' }, to: { backgroundPosition: '-50% 0' } }, tick: { to: { transform: 'translateX(-50%)' } } },
      animation: { shimmer: 'shimmer 1.4s infinite', tick: 'tick 40s linear infinite' },
    },
  },
} satisfies Config;
