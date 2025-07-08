"use client";

import { useEffect, useState } from "react";
import { Recipe } from "@/app/types/index";
import { backendUrl } from "@/app/utils/api";
import { fetchRecipeByIdService, handleLikeService, checkLikeStatusService } from "@/app/hooks/recipes";
import { useUserStore } from "@/app/stores/userStore";
import { useRouter } from "next/navigation";
import RecipeDetail from "@/app/components/ui/RecipeDetail/RecipeDetail";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import toast from "react-hot-toast";

interface RecipeDetailClientProps {
  id: string;
}

const RecipeDetailClient = ({ id }: RecipeDetailClientProps) => {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewValue, setReviewValue] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const { user } = useUserStore();

  useEffect(() => {
    if (id) {
      fetchRecipeByIdService(id)
        .then((recipe) => {
          setRecipe(recipe);
        })
        .catch((error) => console.error("Error fetching recipe:", error));
    }
  }, [id]);

  useEffect(() => {
    if (!recipe || !user) {
      setIsLiked(false);
      return;
    }

    const checkLikeStatus = async () => {
      try {
        const isLiked = await checkLikeStatusService(user.id, recipe.id);
        setIsLiked(isLiked);
      } catch (error) {
        console.error("Error checking like status:", error);
        setIsLiked(false);
      }
    };

    checkLikeStatus();
  }, [recipe, user]);

  const handleLike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!recipe) return;
    handleLikeService(user.id, recipe.id, setIsLiked, setShowLoginModal);
  };

  const handleReview = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    if (!user || !recipe) return;

    try {
      const response = await fetch(`${backendUrl}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          recipeId: recipe.id,
          rating: reviewValue,
          comment: reviewText,
        }),
      });

      if (response.ok) {
        toast.success("レビューが送信されました");
        setShowReviewModal(false);
        setReviewValue(0);
        setReviewText("");
      } else {
        toast.error("レビュー送信に失敗しました");
      }
    } catch (error) {
      toast.error("レビュー送信に失敗しました");
    }
  };

  return (
    <PageLoading isLoading={!recipe}>
      {recipe && (
        <RecipeDetail
          recipe={recipe}
          isLiked={isLiked}
          showLoginModal={showLoginModal}
          showReviewModal={showReviewModal}
          reviewValue={reviewValue}
          reviewText={reviewText}
          onLike={handleLike}
          onReview={handleReview}
          onReviewSubmit={handleReviewSubmit}
          onReviewTextChange={setReviewText}
          onReviewValueChange={setReviewValue}
          onCloseReviewModal={() => setShowReviewModal(false)}
          onCloseLoginModal={() => setShowLoginModal(false)}
          onLogin={() => router.push("/login/")}
          setShowLoginModal={setShowLoginModal}
        />
      )}
    </PageLoading>
  );
};

export default RecipeDetailClient; 