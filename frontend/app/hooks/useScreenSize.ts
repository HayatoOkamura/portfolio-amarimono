import { useState, useEffect } from 'react';

type Breakpoint = 'sp' | 'tab' | 'pc';

const breakpoints: Record<Breakpoint, number> = {
  sp: 769,
  tab: 1024,
  pc: 1440,
};

export const useScreenSize = (breakpoint: Breakpoint) => {
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      switch (breakpoint) {
        case 'sp':
          setIsBelowBreakpoint(width <= breakpoints.sp);
          break;
        case 'tab':
          setIsBelowBreakpoint(width <= breakpoints.tab);
          break;
        case 'pc':
          setIsBelowBreakpoint(width <= breakpoints.pc);
          break;
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [breakpoint]);

  return isBelowBreakpoint;
};