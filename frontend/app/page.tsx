"use client";

import React from "react";
import IngredientSelector from "./components/layout/IngredientSelector/IngredientSelector";
import GenerateRecipe from "./components/ui/GenerateRecipe/GenerateRecipe";
import styles from "./styles/HomePage.module.scss";

const HomePage = () => {
  return (
    <div className={styles.wrapper}>
      <IngredientSelector />
      <GenerateRecipe />
    </div>
  );
};

export default HomePage;
