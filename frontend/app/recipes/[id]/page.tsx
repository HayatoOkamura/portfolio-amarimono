import type { Metadata } from "next";
import { Recipe } from "@/app/types/index";
import RecipeDetailClient from "./RecipeDetailClient";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/recipes/${params.id}`);
    if (!response.ok) {
      return {
        title: "レシピが見つかりません",
        description: "指定されたレシピが見つかりませんでした。",
      };
    }
    
    const recipe: Recipe = await response.json();
    
    return {
      title: recipe.name,
      description: `${recipe.name}のレシピです。${recipe.summary || '家にある材料で作れる美味しい料理です。'} 材料、手順、栄養情報を詳しく紹介しています。`,
      keywords: [recipe.name, "レシピ", "料理", "作り方", "材料", "手順"],
      openGraph: {
        title: recipe.name,
        description: `${recipe.name}のレシピです。${recipe.summary || '家にある材料で作れる美味しい料理です。'}`,
        url: `/recipes/${params.id}`,
        images: recipe.imageUrl ? [
          {
            url: recipe.imageUrl,
            width: 1200,
            height: 630,
            alt: recipe.name,
          }
        ] : undefined,
      },
      twitter: {
        title: recipe.name,
        description: `${recipe.name}のレシピです。${recipe.summary || '家にある材料で作れる美味しい料理です。'}`,
        images: recipe.imageUrl ? [recipe.imageUrl] : undefined,
      },
    };
  } catch (error) {
    return {
      title: "レシピ詳細",
      description: "レシピの詳細情報を表示します。",
    };
  }
}

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  return <RecipeDetailClient id={params.id} />;
}
