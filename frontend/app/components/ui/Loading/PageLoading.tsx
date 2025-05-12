import React from 'react';
import Loading from './Loading';

interface PageLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ isLoading, children }) => {
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100%',
        width: '100%'
      }}>
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
}; 