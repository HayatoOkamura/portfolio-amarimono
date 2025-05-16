"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TopHeader from "../Header/Top/TopHeader";
import SideHeader from "../Header/Side/SideHeader";
import Main from "../../../Main";
import { ResponsiveWrapper } from "../../common/ResponsiveWrapper";
import { CoachmarkOnboarding } from "../../ui/Onboarding/CoachmarkOnboarding";
import useOnboardingStore from "@/app/stores/onboardingStore";
import styles from "./Container.module.scss";

const ClientContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { hasSeenOnboarding, setHasSeenOnboarding } = useOnboardingStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isAuthPage = pathname.startsWith("/login") || 
                    pathname.startsWith("/signup") ||
                    pathname.startsWith("/verify-email") ||
                    pathname.startsWith("/callback") ||
                    pathname.startsWith("/profile-setup");

  useEffect(() => {
    if (!isAuthPage && !hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [isAuthPage, hasSeenOnboarding]);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className={styles.container_block}>
      <ResponsiveWrapper breakpoint="tab" renderBelow={null}>
        <SideHeader />
      </ResponsiveWrapper>
      <div className={styles.container_block__inner}>
        <TopHeader />
        <Main>{children}</Main>
      </div>
      <CoachmarkOnboarding
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
      />
    </div>
  );
};

export default ClientContainer; 