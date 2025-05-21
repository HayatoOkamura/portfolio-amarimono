// app/components/CategoryCard/CategoryCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import styles from "./CategoryCard.module.scss";
import { Genre } from "@/app/types/index";

type CategoryCardProps = {
  genre: Genre;
  onClick: () => void;
  isSelected?: boolean;
};

const CategoryCard: React.FC<CategoryCardProps> = ({ genre, onClick, isSelected }) => {
  // IDが1桁の場合は0を付加し、2桁の場合はそのまま使用
  const imageId = genre.id < 10 ? `0${genre.id}` : genre.id;

  console.log(isSelected);
  
  return (
    <button
      className={`${styles.card_block} ${isSelected ? styles["current"] : ''}`}
      onClick={onClick}
    >
      <div className={styles.card_block__image}>
        <Image
          // fill
          src={`/images/top/pic_category${imageId}.jpg`}
          alt={genre.name}
          // priority
          width={100}
          height={100}
        />
      </div>
      <p className={styles.card_block__text}>{genre.name}</p>
    </button>
  );
};

export default CategoryCard;
