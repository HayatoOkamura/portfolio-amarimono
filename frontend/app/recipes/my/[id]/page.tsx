'use client';

import RecipeDetail from '@/app/components/ui/RecipeDetail/RecipeDetail';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { handleLikeService } from '@/app/hooks/recipes';
import { useRecipe } from '@/app/hooks/recipes';
import { useRecipeActions } from '@/app/hooks/useRecipeActions';
import { useState } from 'react';
import { PageLoading } from '@/app/components/ui/Loading/PageLoading';
import { withAuth } from '@/app/components/auth/withAuth';

function MyRecipeDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { data: recipe, isLoading, error } = useRecipe(id as string);
  const { handleDelete, handleTogglePublish } = useRecipeActions({ 
    recipeId: id as string,
    redirectPath: '/recipes/my'
  });
  const [isLiked, setIsLiked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewValue, setReviewValue] = useState(0);
  const [reviewText, setReviewText] = useState('');

  if (error) return <div>Not found</div>;

  return (
    <PageLoading isLoading={isLoading}>
      {recipe && (
        <RecipeDetail
          recipe={recipe}
          isLiked={isLiked}
          isAdmin={true}
          showLoginModal={showLoginModal}
          showReviewModal={showReviewModal}
          reviewValue={reviewValue}
          reviewText={reviewText}
          onLike={() => {
            if (!user) {
              setShowLoginModal(true);
              return;
            }
            handleLikeService(user.id, recipe.id, setIsLiked, setShowLoginModal);
          }}
          onReview={() => setShowReviewModal(true)}
          onReviewSubmit={async () => {
            if (!user || !recipe) return;
            try {
              const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  recipeId: recipe.id,
                  rating: reviewValue,
                  comment: reviewText,
                }),
              });
              if (response.ok) {
                alert('レビューが送信されました');
                setShowReviewModal(false);
                setReviewValue(0);
                setReviewText('');
              } else {
                alert('レビュー送信に失敗しました');
              }
            } catch (error) {
              alert('レビュー送信に失敗しました');
            }
          }}
          onReviewTextChange={setReviewText}
          onReviewValueChange={setReviewValue}
          onCloseReviewModal={() => setShowReviewModal(false)}
          onCloseLoginModal={() => setShowLoginModal(false)}
          onLogin={() => router.push('/login')}
          userId={user?.id}
          setShowLoginModal={setShowLoginModal}
          onEdit={() => router.push(`/recipes/my/${recipe.id}/edit`)}
          onPublish={handleTogglePublish}
          onDelete={handleDelete}
        />
      )}
    </PageLoading>
  );
}

function MyRecipeDetail() {
  return <MyRecipeDetailContent />;
}

export default withAuth(MyRecipeDetail);
