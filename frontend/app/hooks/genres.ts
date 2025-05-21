import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { Genre } from '@/app/types/index';

export const useGenres = () => {
  return useQuery<Genre[]>({
    queryKey: ['ingredientGenres'],
    queryFn: async () => {
      const response = await api.get<Genre[]>('/api/ingredient_genres');
      return response.data;
    },
  });
}; 