"use client";

import React from "react";
import styles from "./Loading.module.scss";

type LoadingProps = {
  type?: "spinner" | "dots" | "bars"; // 複数のアニメーションパターン
};

const Loading: React.FC<LoadingProps> = ({ type = "spinner" }) => {
  return (
    <div className={styles.loading_block}>
      {type === "spinner" && <div className={styles.loading_block__spinner}></div>}
      {type === "dots" && (
        <div className={styles.loading_block__dots}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      {type === "bars" && <div className={styles.loading_block__bars}></div>}
    </div>
  );
};

export default Loading;
