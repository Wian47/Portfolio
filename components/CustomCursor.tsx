/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { usePerfTier } from '../utils/perf';

/**
 * A bright ring that trails the pointer and swells over anything interactive.
 *
 * This used to composite with mix-blend-difference, which inverts against the
 * backdrop - and against a mid grey it inverts to almost the same mid grey, so
 * the cursor vanished over parts of the project screenshots. It now paints its
 * own colour and carries a dark outer hairline plus a soft glow, so it separates
 * from whatever is underneath instead of depending on it.
 *
 * Full tier only either way: a cursor that repaints on every pointer move is a
 * repaint per mouse event once the GPU is out of the picture.
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
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block"
      style={{ x, y, translateX: '-50%', translateY: '-50%' }}
    >
      <motion.div
        className="flex items-center justify-center rounded-full border-2 border-white"
        style={{
          // Dark hairline for separation on pale screenshots, glow for presence
          // on the charcoal.
          boxShadow: '0 0 0 1.5px rgba(0,0,0,0.55), 0 0 16px rgba(255,255,255,0.4)'
        }}
        animate={{
          width: isHovering ? 64 : 22,
          height: isHovering ? 64 : 22,
          backgroundColor: isHovering ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)'
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        {/* Solid core, so there is always something bright to track */}
        <motion.span
          className="block h-1 w-1 rounded-full bg-white"
          animate={{ opacity: isHovering ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default CustomCursor;
