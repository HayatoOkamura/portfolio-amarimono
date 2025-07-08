"use client";

import { useState } from "react";
import { backendUrl } from "@/app/utils/api";
import { Recipe } from "@/app/types/index";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useDeleteRecipe, useRecipe } from "@/app/hooks/recipes";
import RecipeDetail from "@/app/components/ui/RecipeDetail/RecipeDetail";
import { useQueryClient } from "@tanstack/react-query";

const AdminRecipeDetailClient = () => {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const deleteRecipeMutation = useDeleteRecipe();
  const id = params.id as string;

  const { data: recipe, isLoading, error } = useRecipe(id);

  const handleDelete = async () => {
    if (!recipe) return;
    
    if (confirm("Are you sure you want to delete this recipe?")) {
      try {
        await deleteRecipeMutation.mutateAsync(recipe.id);
        router.push("/admin/recipes");
      } catch (error) {
        console.error("Error deleting recipe:", error);
        alert("Failed to delete recipe");
      }
    }
  };

  const handleTogglePublish = async () => {
    if (!recipe) return;
    try {
      const response = await fetch(`${backendUrl}/admin/recipes/${recipe.id}/toggle-publish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        // TanStack Queryのキャッシュを更新
        queryClient.setQueryData(['recipes', 'detail', id], (oldData: Recipe | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            isPublic: !oldData.isPublic
          };
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to toggle publish status");
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      alert("Failed to toggle publish status");
    }
  };
  
  if (error) {
    return <div>Error loading recipe: {error.message}</div>;
  }

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <RecipeDetail
      recipe={recipe}
      isAdmin={true}
      onEdit={() => router.push(`/admin/recipes/${recipe.id}/edit`)}
      onPublish={handleTogglePublish}
      onDelete={handleDelete}
      setShowLoginModal={() => {}}
    />
  );
};

export default AdminRecipeDetailClient; 