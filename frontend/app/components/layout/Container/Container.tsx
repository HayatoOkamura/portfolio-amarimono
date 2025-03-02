"use client";

import React from "react";
import styles from "./Container.module.scss";
import TopHeader from "../Header/Top/TopHeader";
import SideHeader from "../Header/Side/SideHeader";
import Main from "../../../Main";

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className={styles.container_block}>
      <SideHeader />
      <div className={styles.container_block__inner}>
        <TopHeader />
        <Main>{children}</Main>
      </div>
    </div>
  );
};

export default Container;
