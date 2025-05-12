"use client";

import React from "react";
import Loading from "./components/ui/Loading/Loading";

export default function LoadingPage() {
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