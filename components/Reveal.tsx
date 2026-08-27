/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';

/**
 * Scroll-triggered reveal. A single shared IntersectionObserver flips a data
 * attribute and unobserves, so the whole page costs one observer and one CSS
 * transition per element - no animation loop, which is what keeps this smooth
 * when the browser is compositing on the CPU. The transition itself lives in
 * index.html under [data-reveal].
 */

let observer: IntersectionObserver | null = null;

const getObserver = (): IntersectionObserver => {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute('data-shown', '');
          observer?.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
  }
  return observer;
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

    const io = getObserver();
    io.observe(el);
    return () => io.unobserve(el);
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
