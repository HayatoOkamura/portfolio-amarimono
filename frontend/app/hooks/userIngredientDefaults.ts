import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuth } from './useAuth';

interface IngredientDefault {
  ingredient_id: number;
  default_quantity: number;
}

// 認証不要の具材初期設定を取得
export const useIngredientDefaults = () => {
  return useQuery<IngredientDefault[]>({
    queryKey: ['ingredientDefaults'],
    queryFn: async () => {
      const response = await api.get<IngredientDefault[]>('/api/ingredient-defaults', {
        withCredentials: true
      });
      return response.data;
    },
  });
};

// 認証不要の具材初期設定を更新
export const useUpdateIngredientDefaults = () => {
  return useMutation({
    mutationFn: async (updates: IngredientDefault[]) => {
      const response = await api.put('/api/ingredient-defaults', updates, {
        withCredentials: true
      });
      return response.data;
    },
  });
};

// 認証済みユーザーの具材初期設定を取得
export const useUserIngredientDefaults = () => {
  const { user } = useAuth();
  return useQuery<IngredientDefault[]>({
    queryKey: ['userIngredientDefaults', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');
      const response = await api.get<IngredientDefault[]>(`/api/user/ingredient-defaults?user_id=${user.id}`, {
        withCredentials: true
      });
      return response.data;
    },
    enabled: !!user?.id,
  });
};

// 認証済みユーザーの具材初期設定を更新
export const useUpdateUserIngredientDefaults = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: IngredientDefault[]) => {
      if (!user?.id) throw new Error('User ID is required');
      const response = await api.put(`/api/user/ingredient-defaults?user_id=${user.id}`, updates, {
        withCredentials: true
      });
      return response.data;
    },
  });
}; 