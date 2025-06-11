import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { useAIUsage } from "./aiUsage";
import { useQueryClient } from "@tanstack/react-query";

interface GenerateDescriptionResponse {
  catchphrase: string;
  summary: string;
}

export const useRecipeDescription = () => {
  const { remainingUsage } = useAIUsage();
  const queryClient = useQueryClient();

  const generateDescription = async (recipeName: string): Promise<GenerateDescriptionResponse> => {
    console.log("=== Recipe Description Generation ===");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
    console.log("Recipe Name:", recipeName);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No session found");
      throw new Error("セッションが存在しません");
    }

    console.log("Session status:", session ? "Active" : "Inactive");
    console.log("Making API request to:", `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recipe/generate-description`);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recipe/generate-description`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ recipe_name: recipeName }),
      }
    );

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error response:", errorData);
      if (response.status === 429) {
        throw new Error("月間の使用回数制限に達しました");
      } else if (response.status === 401) {
        throw new Error("セッションが切れました。ページを再読み込みしてください。");
      }
      throw new Error(errorData.error || "説明文の生成中にエラーが発生しました");
    }

    const data = await response.json();
    console.log("Success response:", data);
    
    // AI生成が成功した後に使用回数を更新
    await queryClient.invalidateQueries({ queryKey: ["aiUsage"] });
    
    return data;
  };

  return { generateDescription, remainingUsage };
}; 