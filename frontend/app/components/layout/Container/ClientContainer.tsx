"use client";

import React from "react";
import { usePathname } from "next/navigation";
import TopHeader from "../Header/Top/TopHeader";
import SideHeader from "../Header/Side/SideHeader";
import Main from "../../../Main";
import { ResponsiveWrapper } from "../../common/ResponsiveWrapper";
import styles from "./Container.module.scss";

const ClientContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith("/login") || 
                    pathname.startsWith("/signup") ||
                    pathname.startsWith("/verify-email") ||
                    pathname.startsWith("/callback") ||
                    pathname.startsWith("/profile-setup");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className={styles.container_block}>
      <ResponsiveWrapper breakpoint="tab">
        <SideHeader />
      </ResponsiveWrapper>
      <div className={styles.container_block__inner}>
        <TopHeader />
        <Main>{children}</Main>
      </div>
    </div>
  );
};

export default ClientContainer; 