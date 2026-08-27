/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { usePerfTier } from '../utils/perf';

/**
 * A quiet ring that trails the pointer and swells over anything interactive.
 * Full tier only: mix-blend-difference makes the browser re-read and recomposite
 * whatever sits underneath on every pointer move, which is a repaint per mouse
 * event once the GPU is out of the picture.
 */
const CustomCursor: React.FC = () => {
  const isLite = usePerfTier() === 'lite';
  const [isHovering, setIsHovering] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const x = useSpring(mouseX, { damping: 26, stiffness: 380, mass: 0.12 });
  const y = useSpring(mouseY, { damping: 26, stiffness: 380, mass: 0.12 });

  useEffect(() => {
    if (isLite) return;

    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      setIsHovering(!!target.closest('a, button, [data-hover="true"]'));
    };

    window.addEventListener('mousemove', updateMousePosition, { passive: true });
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [mouseX, mouseY, isLite]);

  if (isLite) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden mix-blend-difference md:block"
      style={{ x, y, translateX: '-50%', translateY: '-50%' }}
    >
      <motion.div
        className="rounded-full border border-white"
        animate={{
          width: isHovering ? 64 : 18,
          height: isHovering ? 64 : 18,
          backgroundColor: isHovering ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)'
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      />
    </motion.div>
  );
};

export default CustomCursor;
