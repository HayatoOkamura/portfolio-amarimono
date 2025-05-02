import React from "react";
import ClientContainer from "./ClientContainer";

const Container = async ({ children }: { children: React.ReactNode }) => {
  return <ClientContainer>{children}</ClientContainer>;
};

export default Container;
