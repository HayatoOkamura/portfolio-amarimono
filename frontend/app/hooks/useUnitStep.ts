const useUnitStep = () => {
  return (unitId: number) => {
    switch (unitId) {
      case 1: // グラム (g)
      case 2: // ミリリットル (ml)
        return 50;
      case 4: // 大さじ
        return 15;
      case 5: // 小さじ
        return 5;
      case 6: // キログラム
        return 1000;
      case 7: // リットル
        return 1000;
      default: // 個, 枚, 本, 房, パック, 袋, 束, 株, 缶, 切れ, 尾, 杯, 玉, 丁, 瓶
        return 1;
    }
  };
};

export default useUnitStep;
