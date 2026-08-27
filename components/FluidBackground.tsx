/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePerfTier } from '../utils/perf';

const StarField = () => {
  // Reduced star count for performance
  const stars = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.7 + 0.3
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white will-change-[opacity,transform]"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            transform: 'translateZ(0)'
          }}
          initial={{ opacity: star.opacity, scale: 1 }}
          animate={{
            opacity: [star.opacity, 1, star.opacity],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration * 2, // Slower animation
            repeat: Infinity,
            ease: "easeInOut",
            delay: star.delay,
          }}
        />
      ))}
    </div>
  );
};

const FluidBackground: React.FC = () => {
  const tier = usePerfTier();

  /*
    Without GPU compositing the three blurred, screen-blended blobs are a
    full-viewport Gaussian blur per frame, forever. Serve a static gradient
    instead - same palette, zero per-frame cost.
  */
  if (tier === 'lite') {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#31326f] via-[#28295c] to-[#1f2048]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(60% 50% at 10% 5%, rgba(168, 251, 211, 0.16), transparent 70%),' +
              'radial-gradient(55% 45% at 95% 30%, rgba(79, 183, 179, 0.14), transparent 70%),' +
              'radial-gradient(60% 50% at 40% 100%, rgba(99, 122, 185, 0.16), transparent 70%)'
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#31326f] via-[#28295c] to-[#1f2048]">
      
      <StarField />

      {/* Blob 1: Mint - Optimized Blur (60px -> 40px) and Animation Speed */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[90vw] h-[90vw] bg-[#a8fbd3] rounded-full mix-blend-screen filter blur-[40px] opacity-30 will-change-transform"
        animate={{
          x: [0, 50, -25, 0],
          y: [0, -25, 25, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Blob 2: Teal */}
      <motion.div
        className="absolute top-[20%] right-[-20%] w-[100vw] h-[80vw] bg-[#4fb7b3] rounded-full mix-blend-screen filter blur-[40px] opacity-20 will-change-transform"
        animate={{
          x: [0, -50, 25, 0],
          y: [0, 50, -25, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Blob 3: Periwinkle */}
      <motion.div
        className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[80vw] bg-[#637ab9] rounded-full mix-blend-screen filter blur-[40px] opacity-20 will-change-transform"
        animate={{
          x: [0, 75, -75, 0],
          y: [0, -50, 50, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Static Grain Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/10 to-black/60 pointer-events-none" />
    </div>
  );
};

export default FluidBackground;