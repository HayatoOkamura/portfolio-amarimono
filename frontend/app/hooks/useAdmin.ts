import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/api/supabase/supabaseClient';
import { api } from '@/app/utils/api';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        const response = await api.get(`/api/users/${session.user.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        const userData = response.data;
        setIsAdmin(userData?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading };
}; 