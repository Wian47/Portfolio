/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { usePerfTier } from '../utils/perf';

const CustomCursor: React.FC = () => {
  const tier = usePerfTier();
  const [isHovering, setIsHovering] = useState(false);
  
  // Initialize off-screen to prevent flash
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Smooth spring animation
  const springConfig = { damping: 20, stiffness: 350, mass: 0.1 }; 
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (tier === 'lite') return;

    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      const clickable = target.closest('button') || 
                        target.closest('a') || 
                        target.closest('[data-hover="true"]');
      setIsHovering(!!clickable);
    };

    window.addEventListener('mousemove', updateMousePosition, { passive: true });
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [mouseX, mouseY, tier]);

  /*
    mix-blend-difference forces the browser to re-read and re-composite whatever
    is underneath the cursor on every pointer move. In software that is a repaint
    per mouse event, so fall back to the native cursor.
  */
  if (tier === 'lite') return null;

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference flex items-center justify-center hidden md:flex will-change-transform"
      style={{ x, y, translateX: '-50%', translateY: '-50%' }}
    >
      {/* This div is the actual cursor "body" and will handle the scaling and text centering */}
      {/* Changed base size to 80px diameter (40px radius) */}
      <motion.div
        className="relative rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)] flex items-center justify-center"
        style={{ width: 80, height: 80 }}
        animate={{
          // Scaled by 1.5 to become 120px diameter (60px radius) when hovering
          scale: isHovering ? 1.5 : 1, 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Text directly inside the scalable cursor body, centered by flex parent */}
        <motion.span 
          className="z-10 text-black font-black uppercase tracking-widest text-sm overflow-hidden whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isHovering ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          View
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default CustomCursor;