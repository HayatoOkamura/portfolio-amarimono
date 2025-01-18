"use client";

import React from "react";
import styles from "./Container.module.scss";
import Header from "../Header/Header";
import Main from "../../../Main";

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  return (
    <div className={styles.container_block}>
      <Header />
      <Main>{children}</Main>
    </div>
  );
};

export default Container;
