/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { backendUrl } from "@/app/utils/apiUtils";
import { Recipe } from "@/app/types/index";
import { fetchRecipeByIdService } from "@/app/hooks/recipes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDeleteRecipe } from "@/app/hooks/recipes";
import RecipeDetail from "@/app/components/ui/RecipeDetail/RecipeDetail";

const AdminRecipeDetail = () => {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const deleteRecipeMutation = useDeleteRecipe();

  useEffect(() => {
    const id = window.location.pathname.split("/").pop();
    if (id && id !== "recipes") {
      fetchRecipeByIdService(id)
        .then((recipeData) => {
          setRecipe(recipeData);
        })
        .catch((error) => console.error("Error fetching recipe:", error));
    }
  }, []);

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
      const response = await fetch(`${backendUrl}/api/recipes/${recipe.id}/toggle-publish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic: !recipe.isPublic }),
      });
      if (response.ok) {
        setRecipe({ ...recipe, isPublic: !recipe.isPublic });
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  if (!recipe) {
    return <div>Loading...</div>;
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

export default AdminRecipeDetail; 