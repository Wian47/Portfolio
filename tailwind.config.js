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
    extend: {}
  },
  plugins: []
};
