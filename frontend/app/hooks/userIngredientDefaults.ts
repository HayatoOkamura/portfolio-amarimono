import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

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
  return useQuery<IngredientDefault[]>({
    queryKey: ['userIngredientDefaults'],
    queryFn: async () => {
      const response = await api.get<IngredientDefault[]>('/api/user/ingredient-defaults', {
        withCredentials: true
      });
      return response.data;
    },
  });
};

// 認証済みユーザーの具材初期設定を更新
export const useUpdateUserIngredientDefaults = () => {
  return useMutation({
    mutationFn: async (updates: IngredientDefault[]) => {
      const response = await api.put('/api/user/ingredient-defaults', updates, {
        withCredentials: true
      });
      return response.data;
    },
  });
}; 