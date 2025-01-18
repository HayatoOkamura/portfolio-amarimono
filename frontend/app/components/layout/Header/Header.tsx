"use client";

import React from "react";
import styles from "./Header.module.scss"
import { FaUser } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { TbBowlSpoonFilled } from "react-icons/tb";
import { FaHeart } from "react-icons/fa";
import { IoIosExit } from "react-icons/io";

const Header = () => {
  return (
    <header className={styles.header_block}>
      <div className={styles.header_block__inner}>
        <div className={styles.header_block__icon}>
          <FaUser />
        </div>
        <div className={`${styles.header_block__icon} ${styles["header_block__icon--middle"]} ${styles['is-active']}`}>
          <ImSpoonKnife />
        </div>
        <div className={styles.header_block__icon}>
          <TbBowlSpoonFilled />
        </div>
        <div className={styles.header_block__icon}>
          <FaHeart />
        </div>
        <div
          className={`${styles.header_block__icon} ${styles["header_block__icon--foot"]}`}
        >
          <IoIosExit />
        </div>
      </div>
    </header>
  );
};

export default Header;
