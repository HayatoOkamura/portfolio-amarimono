"use client";

import React from "react";
import { Suspense } from "react";
import Loading from "../components/ui/Loading/Loading";
import RecipeClientComponent from "./RecipeClientComponent";


const RecipesPageContent = () => {
  return (
    <Suspense fallback={<Loading />}>
      <RecipeClientComponent />
    </Suspense>
  );
};

export default RecipesPageContent;
