// app/components/CategoryCard/CategoryCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import styles from "./CategoryCard.module.scss";
import { Genre } from "@/app/types";

type CategoryCardProps = {
  genre: Genre;
  onClick: () => void;
};

const CategoryCard: React.FC<CategoryCardProps> = ({ genre, onClick }) => {
  return (
    <button
      className={styles.card_block}
      onClick={onClick}
    >
      <div className={styles.card_block__image}>
        <Image
          fill
          src={`/images/top/pic_category0${genre.id}.jpg`}
          alt={genre.name}
        />
      </div>
      <p className={styles.card_block__text}>{genre.name}</p>
    </button>
  );
};

export default CategoryCard;
