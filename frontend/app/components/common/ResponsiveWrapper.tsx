import React from 'react';
import { useScreenSize } from '@/app/hooks/useScreenSize';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  breakpoint: 'sp' | 'tab' | 'pc';
  renderBelow?: React.ReactNode;
  renderAbove?: React.ReactNode;
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  children,
  breakpoint,
  renderBelow,
  renderAbove,
}) => {
  const isBelowBreakpoint = useScreenSize(breakpoint);

  if (isBelowBreakpoint) {
    return <>{renderBelow !== undefined ? renderBelow : children}</>;
  }

  return <>{renderAbove !== undefined ? renderAbove : children}</>;
};