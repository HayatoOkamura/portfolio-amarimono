"use client";

import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import styles from "./Loading.module.scss";

interface RecipeLoadingProps {
  progress: number;
}

const RecipeLoading: React.FC<RecipeLoadingProps> = ({ progress }) => {
  return (
    <div className={styles.loading_block}>
      <div className={styles.loading_block__progress}>
        <div className={styles.progress_bar}>
          <div 
            className={styles.progress_bar__fill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className={styles.loading_block__text}>
        レシピを作成中です。少々お待ちください...
      </p>
      <DotLottieReact
        src="https://lottie.host/c95f69b5-4afe-45b5-8cf8-d3a18e953421/scRHkxlZnY.lottie"
        loop
        autoplay
        className={styles.loading_block__lottie}
      />
    </div>
  );
};

export default RecipeLoading; 