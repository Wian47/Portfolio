/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import { initPerfTier } from './utils/perf';

// Decide the rendering tier before the first paint so the CSS hook is already in place.
initPerfTier();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);