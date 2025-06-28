"use client";

import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import styles from "./Loading.module.scss";

const Loading: React.FC = () => {
  return (
    <div className={styles.loading_block}>
      <DotLottieReact
        src="https://lottie.host/593f8704-611e-44a2-8442-c42fc8e8d3fc/5hnEEVP1Y6.lottie"
        loop
        autoplay
        className={styles.loading_block__lottie}
      />
    </div>
  );
};

export default Loading;
