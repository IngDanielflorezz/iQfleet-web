import { useEffect, useRef } from 'react';

const DEFAULT_MAX_BLUR_PX = 12;

export default function useScrollFade({
  fadeDistance,
  maxBlurPx = DEFAULT_MAX_BLUR_PX,
  translatePx = 0,
  scaleRange = 0,
} = {}) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let animationFrame = null;

    const render = () => {
      animationFrame = null;

      const distance = fadeDistance ?? window.innerHeight * 0.75;
      const progress = distance > 0 ? Math.min(window.scrollY / distance, 1) : 0;
      const eased = progress * progress;

      element.style.opacity = String(1 - eased);
      element.style.filter = eased > 0 ? `blur(${(eased * maxBlurPx).toFixed(2)}px)` : 'none';
      element.style.visibility = progress >= 1 ? 'hidden' : 'visible';

      if (!prefersReducedMotion && (translatePx !== 0 || scaleRange !== 0)) {
        element.style.transform = `translateY(${eased * translatePx}px) scale(${1 + eased * scaleRange})`;
      }
    };

    const requestRender = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    render();
    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender);

    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', requestRender);
      window.removeEventListener('resize', requestRender);
    };
  }, [fadeDistance, maxBlurPx, translatePx, scaleRange]);

  return elementRef;
}
