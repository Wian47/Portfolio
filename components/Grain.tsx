/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

/**
 * Atmosphere layer: a fine film grain over a warm vignette. The grain is an
 * inline SVG turbulence tile, so there is no network request and nothing to
 * animate; the .grain class is switched off entirely on the lite tier, where a
 * full-viewport blended layer would cost a repaint per frame.
 */

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

const Grain: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 -z-10">
    {/* Warm floor, slightly lifted toward the top-left so the page has a light source */}
    <div
      className="absolute inset-0 bg-ink"
      style={{
        backgroundImage:
          'radial-gradient(120% 90% at 12% 0%, rgba(201, 112, 74, 0.10), transparent 58%),' +
          'radial-gradient(100% 80% at 88% 12%, rgba(160, 150, 135, 0.06), transparent 60%)'
      }}
    />
    {/* Vignette to keep the edges quiet */}
    <div
      className="absolute inset-0"
      style={{ backgroundImage: 'radial-gradient(130% 100% at 50% 40%, transparent 40%, rgba(8, 7, 6, 0.55) 100%)' }}
    />
    <div
      className="grain absolute inset-0 opacity-[0.05] mix-blend-overlay"
      style={{ backgroundImage: NOISE }}
    />
  </div>
);

export default Grain;
