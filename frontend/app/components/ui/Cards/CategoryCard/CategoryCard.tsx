// app/components/CategoryCard/CategoryCard.tsx
"use client";

import React from 'react';
import styles from './CategoryCard.module.scss';

type CategoryCardProps = {
  genre: string;
  onClick: () => void;
};

const CategoryCard: React.FC<CategoryCardProps> = ({ genre, onClick }) => {
  return (
    <button className={styles.card_block} onClick={onClick}>
      {genre}
    </button>
  );
};

export default CategoryCard;
