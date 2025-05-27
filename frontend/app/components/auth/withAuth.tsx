"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

    if (isLoading) {
      return <PageLoading isLoading={true}><div /></PageLoading>;
    }

    if (!user && isAuthRequired(pathname)) {
      return <LoginModal onLogin={() => router.push('/login')} />;
    }

    return <WrappedComponent {...props} />;
  };
} 