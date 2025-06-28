"use client";

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { isAuthRequired } from '@/app/lib/constants/auth';
import { PageLoading } from '@/app/components/ui/Loading/PageLoading';
import LoginModal from '@/app/components/ui/LoginModal/LoginModal';

export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithAuthComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isSetupMode = searchParams.get('setup') === 'true';

    useEffect(() => {
      // セットアップモードの場合は認証チェックをスキップ
      if (isSetupMode) {
        return;
      }

      if (!isLoading && !user && isAuthRequired(pathname)) {
        router.push('/login');
      }
    }, [user, isLoading, pathname, router, isSetupMode]);

    if (isLoading) {
      return <PageLoading isLoading={true}><div /></PageLoading>;
    }

    // セットアップモードの場合は認証チェックをスキップ
    if (isSetupMode) {
      return <WrappedComponent {...props} />;
    }

    if (!user && isAuthRequired(pathname)) {
      return <LoginModal onLogin={() => router.push('/login')} />;
    }

    return <WrappedComponent {...props} />;
  };
} 