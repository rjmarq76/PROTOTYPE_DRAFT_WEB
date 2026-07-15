import { useEffect, useState } from 'react';

/**
 * True below Tailwind's `sm` breakpoint (640px). Used to scale down
 * chart internals (axis widths, font sizes, radii) that use fixed pixel
 * values recharts can't express with CSS media queries alone, so mobile
 * gets the same chart logic as desktop, just sized to fit.
 */
export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}
