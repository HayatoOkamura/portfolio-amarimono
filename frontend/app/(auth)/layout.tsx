"use client";

import { ReactNode } from "react";
import Image from "next/image";
import styles from "./AuthLayout.module.scss";
import { ResponsiveWrapper } from "@/app/components/common/ResponsiveWrapper";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout_block}>
      <div className={styles.layout_block__inner}>
        <ResponsiveWrapper breakpoint="sp" renderBelow={null}> 
        <div className={styles.layout_block__bg}>
          <div className={styles.layout_block__img}>
            <Image
              src="/images/login/pic_login_bg.webp"
              alt="auth_bg"
              quality={100}
              width={2048}
              height={2048}
            />
          </div>
        </div>
        </ResponsiveWrapper>
        <div className={styles.layout_block__content}>
          {children}
        </div>
      </div>
    </div>
  );
}
