"use client";

import React, { createContext, useContext, ReactNode } from "react";
import useLoadingStore from "../stores/loadingStore";
import Loading from "../components/ui/Loading/Loading";

interface LoadingProviderProps {
  children: ReactNode;
}

const LoadingContext = createContext<{
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}>({
  isLoading: false,
  setIsLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export default function LoadingProvider({ children }: LoadingProviderProps) {
  const isLoading = useLoadingStore((state) => state.isLoading);
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {isLoading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100%',
          width: '100%'
        }}>
          <Loading />
        </div>
      ) : (
        children
      )}
    </LoadingContext.Provider>
  );
} 