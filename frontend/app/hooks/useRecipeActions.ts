import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useDeleteRecipe } from './recipes';
import { backendUrl } from '@/app/utils/api';

interface UseRecipeActionsProps {
  recipeId: string;
  redirectPath?: string;
}

export const useRecipeActions = ({ recipeId, redirectPath = '/user/recipes/' }: UseRecipeActionsProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const deleteRecipeMutation = useDeleteRecipe();

  const handleDelete = async () => {
    if (confirm("このレシピを削除してもよろしいですか？")) {
      try {
        await deleteRecipeMutation.mutateAsync(recipeId);
        router.push(redirectPath);
      } catch (error) {
        console.error("Error deleting recipe:", error);
        alert("レシピの削除に失敗しました");
      }
    }
  };

  const handleTogglePublish = async () => {
    try {
      const response = await fetch(`${backendUrl}/admin/recipes/${recipeId}/toggle-publish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        queryClient.setQueryData(['recipes', 'detail', recipeId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            isPublic: !oldData.isPublic
          };
        });
      } else {
        throw new Error("公開状態の変更に失敗しました");
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      alert("公開状態の変更に失敗しました");
    }
  };

  return {
    handleDelete,
    handleTogglePublish
  };
}; 