/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';
import { getPerfTier } from '../utils/perf';

/**
 * Scroll-triggered reveal, playing in both directions: elements rise in as they
 * enter the viewport and reset once they have fully left it, so scrolling back
 * up replays the animation rather than walking through a page that is already
 * fully revealed.
 *
 * Two shared observers rather than one, because a single threshold would make
 * elements flicker at the viewport edge - the point at which an element is
 * "in" has to sit well inside the point at which it is "out":
 *
 *   reveal  8% visible, and clear of the bottom 10% of the viewport
 *   reset   0% visible, measured against the whole viewport
 *
 * That gap is the hysteresis. Nothing can satisfy both at once, so an element
 * settling near an edge cannot oscillate. Still two observers for the whole
 * page and one CSS transition per element, with no animation loop.
 *
 * The rise also mirrors the direction of travel, so content always enters from
 * the edge it came in through rather than always rising. That offset is set
 * when an element resets, not when it reveals: the edge it left by is the edge
 * it will come back through, and at that moment it is off screen, so the style
 * change costs nothing and has a clear frame before the transition reads it.
 * Setting it at reveal time would need a forced reflow to be picked up as the
 * transition's starting point.
 *
 * The transition itself lives in index.html under [data-reveal].
 */

let revealObserver: IntersectionObserver | null = null;
let resetObserver: IntersectionObserver | null = null;

/**
 * The lite tier exists to stop per-frame compositing work on a CPU rasteriser,
 * and replaying 26 transitions on every pass is exactly that. It also covers
 * prefers-reduced-motion, which forces this tier: repeatedly fading the page in
 * and out is precisely what someone asking for reduced motion does not want.
 * Checked when an observer fires rather than up front, so the frame-rate probe
 * downgrading a second after load still takes effect.
 */
const isLite = (): boolean => getPerfTier() === 'lite';

const getRevealObserver = (): IntersectionObserver => {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute('data-shown', '');
          if (isLite()) revealObserver?.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
  }
  return revealObserver;
};

const getResetObserver = (): IntersectionObserver => {
  if (!resetObserver) {
    resetObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) return;
          if (isLite()) {
            resetObserver?.unobserve(entry.target);
            return;
          }
          const el = entry.target as HTMLElement;
          const rect = entry.boundingClientRect;
          const top = entry.rootBounds?.top ?? 0;
          const bottom = entry.rootBounds?.bottom ?? window.innerHeight;
          // Left underneath the viewport, so it returns from underneath and
          // should rise; left over the top, so it returns from above and should
          // descend. Anything ambiguous keeps whatever it had.
          if (rect.top >= bottom) el.style.setProperty('--reveal-from', '18px');
          else if (rect.bottom <= top) el.style.setProperty('--reveal-from', '-18px');
          el.removeAttribute('data-shown');
        });
      },
      // No rootMargin: an element must be entirely outside the viewport before
      // it resets, otherwise it would drop out while still partly on screen.
      { threshold: 0 }
    );
  }
  return resetObserver;
};

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger in milliseconds. */
  delay?: number;
  as?: React.ElementType;
}

const Reveal: React.FC<RevealProps> = ({ children, className = '', delay = 0, as: Tag = 'div' }) => {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Without IntersectionObserver the elements would be stranded at opacity 0.
    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-shown', '');
      return;
    }

    const reveal = getRevealObserver();
    const reset = getResetObserver();
    reveal.observe(el);
    reset.observe(el);
    return () => {
      reveal.unobserve(el);
      reset.unobserve(el);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={className}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
