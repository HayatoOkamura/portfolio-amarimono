"use client";

import React from "react";
import ClientContainer from "./ClientContainer";

const Container = ({ children }: { children: React.ReactNode }) => {
  return <ClientContainer>{children}</ClientContainer>;
};

export default Container;
