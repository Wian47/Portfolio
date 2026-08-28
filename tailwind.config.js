/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Warm charcoal rather than black - the whole design rests on this being
        // slightly off-neutral, so the off-white type reads as ink on paper.
        ink: {
          DEFAULT: '#141210',
          raised: '#1c1917',
          line: '#2b2622'
        },
        paper: {
          DEFAULT: '#ece5d8',
          // Contrast against ink: dim 8.05:1, faint 4.66:1. The previous faint
          // was 3.08:1, which fails WCAG AA at the 10-11px the labels use.
          dim: '#b1a99f',
          faint: '#897d70'
        },
        ember: '#c9704a'
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      letterSpacing: {
        label: '0.18em'
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    }
  },
  plugins: []
};
