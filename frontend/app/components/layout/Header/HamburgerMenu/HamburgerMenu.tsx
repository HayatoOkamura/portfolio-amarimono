"use client";

import React from "react";
import styles from "./HamburgerMenu.module.scss";

interface HamburgerMenuProps {
  onClick: () => void;
  isOpen: boolean;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onClick, isOpen }) => {
  return (
    <button className={`${styles.hamburger_menu_block} ${isOpen ? styles["is-open"] : ""}`} onClick={onClick}>
      <span className={styles.hamburger_menu_block__line}></span>
      <span className={styles.hamburger_menu_block__line}></span>
      <span className={styles.hamburger_menu_block__line}></span>
    </button>
  );
};

export default HamburgerMenu; 