import React, { useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Placement } from 'react-joyride';
import styles from './CoachmarkOnboarding.module.scss';

interface CoachmarkOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoachmarkOnboarding: React.FC<CoachmarkOnboardingProps> = ({ isOpen, onClose }) => {
  const [steps] = useState<Step[]>([
    {
      target: 'body',
      content: (
        <div className={styles.content}>
          <h3 className={styles.content__title}>あまりものへようこそ！</h3>
          <p className={styles.content__description}>ここでは手持ちの材料からレシピを検索できます。</p>
        </div>
      ),
      placement: 'center' as Placement,
      disableBeacon: true,
    },
    {
      target: '[data-onboarding="ingredient-selector"]',
      content: (
        <div className={styles.content}>
          <h3 className={styles.content__title}>具材の選択</h3>
          <p className={styles.content__description}>こちらで具材の数を選択してください。</p>
        </div>
      ),
      placement: 'bottom' as Placement,
    },
    {
      target: '[data-onboarding="category-filter"]',
      content: (
        <div className={styles.content}>
          <h3 className={styles.content__title}>カテゴリーで絞り込み</h3>
          <p className={styles.content__description}>カテゴリーで絞り込むこともできます。</p>
        </div>
      ),
      placement: 'bottom' as Placement,
    },
    {
      target: '[data-onboarding="search-button"]',
      content: (
        <div className={styles.content}>
          <h3 className={styles.content__title}>レシピ生成</h3>
          <p className={styles.content__description}>レシピ生成ボタンを押すと、選択した具材を使ったレシピが生成されます。</p>
        </div>
      ),
      placement: 'top' as Placement,
    }
  ]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;
    console.log('Joyride Callback:', {
      status,
      type,
      index,
      action,
      currentStep: steps[index],
      targetExists: typeof steps[index]?.target === 'string' ? document.querySelector(steps[index].target) !== null : false
    });

    if ((status === STATUS.FINISHED || status === STATUS.SKIPPED) && index === steps.length - 1) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Joyride
      steps={steps}
      continuous
      showSkipButton
      showProgress={false}
      disableOverlayClose
      disableCloseOnEsc
      locale={{
        back: '戻る',
        close: '閉じる',
        last: '完了',
        next: '次へ',
        skip: 'スキップ'
      }}
      styles={{
        options: {
          primaryColor: 'var(--primary-accent-color)',
          zIndex: 1000,
        },
        tooltip: {
          backgroundColor: 'white',
          color: 'var(--primary-font-color)',
          borderRadius: '8px',
          padding: '30px 35px',
          width: '460px',
        },
        buttonNext: {
          backgroundColor: 'var(--primary-accent-color)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
        },
        buttonBack: {
          color: 'var(--primary-font-color)',
          marginRight: '1rem',
        },
        buttonSkip: {
          color: 'var(--secondary-font-color)',
        },
      }}
      callback={handleJoyrideCallback}
    />
  );
}; 