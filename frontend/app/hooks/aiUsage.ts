import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/app/lib/api/supabase/supabaseClient';

interface AIUsageResponse {
  usage_count: number;
  usage_limit: number;
}

// AI使用回数を取得
const fetchAIUsage = async (): Promise<AIUsageResponse> => {
  console.log('AI使用回数取得開始');
  const { data: { session } } = await supabase.auth.getSession();
  console.log('セッション状態:', session ? '存在します' : '存在しません');

  if (!session) {
    console.error('セッションが存在しません');
    throw new Error("認証が必要です");
  }

  // バックエンドURLを環境変数から取得
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  console.log('バックエンドURL:', backendUrl);

  const response = await fetch(`${backendUrl}/api/recipe/ai-usage`, {
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    credentials: 'include',
  });

  console.log('AI使用回数レスポンスステータス:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('AI使用回数取得エラー:', error);
    throw new Error(error.error || "使用回数の取得に失敗しました");
  }

  const data = await response.json();
  console.log('取得したAI使用回数:', data);
  return data;
};

// AI使用回数を更新
const updateAIUsage = async (): Promise<AIUsageResponse> => {
  console.log('AI使用回数更新開始');
  const { data: { session } } = await supabase.auth.getSession();
  console.log('セッション状態:', session ? '存在します' : '存在しません');

  if (!session) {
    console.error('セッションが存在しません');
    throw new Error("認証が必要です");
  }

  // バックエンドURLを環境変数から取得
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  console.log('バックエンドURL:', backendUrl);

  const response = await fetch(`${backendUrl}/api/recipe/ai-usage`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    credentials: 'include',
  });

  console.log('AI使用回数更新レスポンスステータス:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('AI使用回数更新エラー:', error);
    throw new Error(error.error || "使用回数の更新に失敗しました");
  }

  const data = await response.json();
  console.log('更新後のAI使用回数:', data);
  return data;
};

export const useAIUsage = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery<AIUsageResponse>({
    queryKey: ["aiUsage"],
    queryFn: fetchAIUsage,
    retry: false,
  });

  const { mutate: incrementUsage } = useMutation({
    mutationFn: updateAIUsage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiUsage"] });
    },
  });

  const remainingUsage = data ? data.usage_limit - data.usage_count : null;

  return { 
    remainingUsage,
    incrementUsage 
  };
}; 