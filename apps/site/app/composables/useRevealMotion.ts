function prefersReducedMotion(): boolean {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Shared fade + slide-up motion preset for v-motion, usable both for
 * on-mount entrances (`enter`) and scroll-triggered reveals (`visibleOnce`).
 * Collapses to a no-op when the user prefers reduced motion.
 */
export function useRevealMotion(delay = 0, distance = 32) {
  if (prefersReducedMotion()) {
    const settled = { opacity: 1, y: 0 };
    return { initial: settled, enter: settled, visibleOnce: settled };
  }

  const settled = { opacity: 1, y: 0, transition: { duration: 550, delay, ease: 'easeOut' } };
  return {
    initial: { opacity: 0, y: distance },
    enter: settled,
    visibleOnce: settled,
  };
}
