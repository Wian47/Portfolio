/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useEffect, useState } from 'react';

export type PerfTier = 'full' | 'lite';

/**
 * The site leans on effects that are only cheap while the compositor runs on the
 * GPU: full-viewport blurs, backdrop-filter panels, blend modes and a handful of
 * infinite animations. With hardware acceleration disabled the browser rasterises
 * all of that on the CPU every single frame and the page crawls. Detect that up
 * front and drop to a "lite" tier that keeps the layout and palette but removes
 * the per-frame work.
 */

const SOFTWARE_RENDERERS =
  /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen|virgl|paravirtual/;

let tier: PerfTier = 'full';
let initialised = false;
const listeners = new Set<(tier: PerfTier) => void>();

const applyTier = (next: PerfTier) => {
  if (initialised && next === tier) return;
  tier = next;
  document.documentElement.dataset.perf = next;
  listeners.forEach((listener) => listener(next));
};

/** True when WebGL is missing or backed by a CPU rasteriser, i.e. GPU acceleration is off. */
const usesSoftwareRendering = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return true;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(
      debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    ).toLowerCase();

    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return SOFTWARE_RENDERERS.test(renderer);
  } catch {
    return true;
  }
};

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Samples the real frame rate once the page has settled, catching what the static probes miss. */
const probeFrameRate = () => {
  const SAMPLE_FRAMES = 30;
  const MIN_FPS = 45;
  let frames = 0;
  let start = 0;

  const step = (now: number) => {
    if (!start) start = now;
    frames += 1;
    if (frames < SAMPLE_FRAMES) {
      requestAnimationFrame(step);
      return;
    }
    const elapsed = now - start;
    if (elapsed > 0 && (frames * 1000) / elapsed < MIN_FPS) applyTier('lite');
  };

  requestAnimationFrame(step);
};

/** `?perf=lite` / `?perf=full` forces a tier, so either path can be checked without touching browser flags. */
const forcedTier = (): PerfTier | null => {
  try {
    const value = new URLSearchParams(location.search).get('perf');
    return value === 'lite' || value === 'full' ? value : null;
  } catch {
    return null;
  }
};

/** Call once before rendering so the `data-perf` CSS hook is set for the first paint. */
export const initPerfTier = (): PerfTier => {
  if (initialised) return tier;

  const forced = forcedTier();
  if (forced) {
    applyTier(forced);
    initialised = true;
    return tier;
  }

  const lite = prefersReducedMotion() || usesSoftwareRendering();
  applyTier(lite ? 'lite' : 'full');
  initialised = true;

  if (!lite) setTimeout(probeFrameRate, 1500);
  return tier;
};

export const getPerfTier = (): PerfTier => tier;

export const usePerfTier = (): PerfTier => {
  const [current, setCurrent] = useState<PerfTier>(getPerfTier);

  useEffect(() => {
    setCurrent(getPerfTier());
    listeners.add(setCurrent);
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);

  return current;
};
