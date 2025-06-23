"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./SearchModeMenu.module.scss";
import { SearchMode } from "@/app/stores/ingredientStore";

interface SearchModeMenuProps {
  currentMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  'data-onboarding'?: string;
}

const SearchModeMenu = ({ currentMode, onModeChange, ...props }: SearchModeMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const searchModes = [
    {
      value: 'exact_with_quantity' as SearchMode,
      label: '材料すべて＋分量も一致',
      description: '選択した具材が全て含まれ、数量も満たすレシピ'
    },
    {
      value: 'exact_without_quantity' as SearchMode,
      label: '材料すべて一致（分量は不問）',
      description: '選択した具材が全て含まれるレシピ（数量は無視）'
    },
    {
      value: 'partial_with_quantity' as SearchMode,
      label: '材料いくつか一致＋分量も一致',
      description: '選択した具材が1つでも含まれ、数量も満たすレシピ'
    },
    {
      value: 'partial_without_quantity' as SearchMode,
      label: '材料いくつか一致（分量は不問）',
      description: '選択した具材が1つでも含まれるレシピ（数量は無視）'
    }
  ];

  const currentModeData = searchModes.find(mode => mode.value === currentMode);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModeSelect = (mode: SearchMode) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  return (
    <div className={styles.menu_container} ref={menuRef} {...props}>
      <button
        className={styles.menu_trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className={styles.menu_trigger__text}>レシピ検索条件</span>
        <span className={`${styles.menu_trigger__arrow} ${isOpen ? styles.menu_trigger__arrow_open : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className={styles.menu_dropdown}>
          {searchModes.map((mode) => (
            <button
              key={mode.value}
              className={`${styles.menu_item} ${currentMode === mode.value ? styles.menu_item_active : ''}`}
              onClick={() => handleModeSelect(mode.value)}
            >
              <div className={styles.menu_item__content}>
                {mode.value === 'partial_without_quantity' && (
                  <div className={styles.menu_item__recommend}>おすすめ</div>
                )}
                <div className={styles.menu_item__label}>{mode.label}</div>
                <div className={styles.menu_item__description}>{mode.description}</div>
              </div>
              {currentMode === mode.value && (
                <span className={styles.menu_item__check}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchModeMenu; 