// app/components/CategoryCard/CategoryCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import styles from "./CategoryCard.module.scss";
import { Genre } from "@/app/types/index";
import { ResponsiveWrapper } from "@/app/components/common/ResponsiveWrapper";

type CategoryCardProps = {
  genre: Genre;
  onClick: () => void;
  isSelected?: boolean;
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  genre,
  onClick,
  isSelected,
}) => {
  // IDが1桁の場合は0を付加し、2桁の場合はそのまま使用
  const imageId = genre.id < 10 ? `0${genre.id}` : genre.id;

  return (
    <button
      className={`${styles.card_block} ${isSelected ? styles["current"] : ""}`}
      onClick={onClick}
    >
      <ResponsiveWrapper breakpoint="sp" renderBelow={null}>
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
      </ResponsiveWrapper>

      <p className={styles.card_block__text}>{genre.name}</p>
    </button>
  );
};

export default CategoryCard;
