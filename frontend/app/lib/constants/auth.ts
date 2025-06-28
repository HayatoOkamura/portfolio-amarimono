export const AUTH_REQUIRED_PATHS = [
  '/user',
  '/user/edit',
  '/user/settings',
  '/favorites',
  // 他のログイン必須ページを追加
] as const;

export const isAuthRequired = (path: string): boolean => {
  return AUTH_REQUIRED_PATHS.some(requiredPath => path.startsWith(requiredPath));
}; 