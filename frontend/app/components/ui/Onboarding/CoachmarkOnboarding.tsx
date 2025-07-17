import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './CoachmarkOnboarding.module.scss';
import './CoachmarkOnboarding.global.scss';
import { InitialSettingsStep } from '../../features/Onboarding/InitialSettingsStep';

// 動的インポート
const Joyride = dynamic(() => import('react-joyride'), {
  ssr: false
});

// 型定義
type Step = {
  target: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  disableBeacon?: boolean;
};

type CallBackProps = {
  status: string;
  type: string;
  index: number;
  action: string;
};

type Placement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

const STATUS = {
  FINISHED: 'finished',
  SKIPPED: 'skipped'
} as const;

interface CoachmarkOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoachmarkOnboarding: React.FC<CoachmarkOnboardingProps> = ({ isOpen, onClose }) => {
  const [showInitialSettings, setShowInitialSettings] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const [steps] = useState<Step[]>([
    {
      target: 'body',
      content: (
        <div className={styles.content}>
          <h3 className={styles.content__title}>あまりものへようこそ！</h3>
          <p className={styles.content__description}>ここでは冷蔵庫の食材からレシピを検索できます。</p>
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
      disableBeacon: false,
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
      disableBeacon: false,
    },
    {
      target: '[data-onboarding="search-mode-menu"]',
      content: (
        <div className={styles.content}>
          <h3 className={styles.content__title}>検索方法の設定</h3>
          <p className={styles.content__description}>検索の厳密さを調整できます。<br />「材料いくつか」なら具材が1つでも含まれるレシピを、「材料すべて」なら全ての具材が必要なレシピを検索します。</p>
        </div>
      ),
      placement: 'bottom' as Placement,
      disableBeacon: false,
    },
    {
      target: '[data-onboarding="search-button"]',
      content: (
        <div className={styles.content}>
          <h3 className={styles.content__title}>レシピ検索</h3>
          <p className={styles.content__description}>レシピ検索ボタンを押すと、選択した具材を使ったレシピが検索されます。</p>
        </div>
      ),
      placement: 'top' as Placement,
      disableBeacon: false,
    }
  ]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    if ((status === STATUS.FINISHED || status === STATUS.SKIPPED) && index === steps.length - 1) {
      setShowInitialSettings(true);
    }
  };

  const handleInitialSettingsComplete = () => {
    setShowInitialSettings(false);
    setShowCompletion(true);
    setTimeout(() => {
      setShowCompletion(false);
      onClose();
    }, 3000);
  };

  if (!isOpen) return null;

  if (showInitialSettings) {
    return (
      <div className={styles.modal_overlay}>
        <div className={styles.modal_content}>
          <InitialSettingsStep onComplete={handleInitialSettingsComplete} />
        </div>
      </div>
    );
  }

  if (showCompletion) {
    return (
      <div className={styles.modal_overlay}>
        <div className={styles.modal_content}>
          <div className={styles.completion_message}>
            <h3>準備完了！</h3>
            <p>これで準備完了です。ぜひご利用ください！</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Joyride
      steps={steps}
      continuous
      showSkipButton
      showProgress={false}
      disableOverlayClose
      disableCloseOnEsc
      scrollToFirstStep
      scrollOffset={100}
      floaterProps={{
        disableAnimation: true,
        placement: 'auto',
        styles: {
          floater: {
            filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.1))',
          },
        },
      }}
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
          zIndex: 10000,
        }
      }}
      callback={handleJoyrideCallback}
    />
  );
}; 