/* eslint-disable */
"use client";
import { useEffect, useState } from "react";
import { Recipe } from "@/app/types/index";
import { backendUrl } from "@/app/utils/apiUtils";
import { fetchRecipeByIdService, handleLikeService, checkLikeStatusService } from "@/app/hooks/recipes";
import { useUserStore } from "@/app/stores/userStore";
import { useRouter } from "next/navigation";
import RecipeDetail from "@/app/components/ui/RecipeDetail/RecipeDetail";

const RecipeDetailPage = () => {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewValue, setReviewValue] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const { user } = useUserStore();

  useEffect(() => {
    const id = window.location.pathname.split("/").pop();
    if (id) {
      fetchRecipeByIdService(id)
        .then((recipe) => {
          setRecipe(recipe);
        })
        .catch((error) => console.error("Error fetching recipe:", error));
    }
  }, []);

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
      alert("レビューが送信されました");
      setShowReviewModal(false);
    } else {
      alert("レビュー送信に失敗しました");
    }
  };

  if (!recipe) {
    return <p>Loading...</p>;
  }

  return (
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
  );
};

export default RecipeDetailPage;
