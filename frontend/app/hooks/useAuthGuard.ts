import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export const useAuthGuard = (requireAdmin: boolean = false) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (requireAdmin && user.role !== 'admin') {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
    }
  }, [user, isLoading, requireAdmin, router]);

  return {
    isAuthorized,
    isLoading,
    user
  };
}; 