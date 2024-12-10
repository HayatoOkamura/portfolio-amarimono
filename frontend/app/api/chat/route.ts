/* eslint-disable */
import { NextResponse } from "next/server";

export async function POST(req: Request) {

  try {
    // リクエストから食材のリストを取得
    const { ingredients } = await req.json();

    console.log(ingredients);
    

    //  const recipePrompt = `次の食材を使ってレシピを5つ生成してください: ${ingredients.join(", ")}`;


    // バックエンドにリクエストを送信
    const backendResponse = await fetch("http://backend:8080/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients: ingredients }), // バックエンドが期待する形式に合わせる
    });

    // バックエンドレスポンスの確認
    if (!backendResponse.ok) {
      const backendError = await backendResponse.text(); // 詳細なエラー取得
      console.error("Backend error:", backendError);
      throw new Error(`Backend responded with ${backendResponse.statusText}`);
    }
    
    // バックエンドからのデータを取得してフロントエンドに返す
    const data = await backendResponse.json();
    
    return NextResponse.json({ response: data }); // 必要に応じてプロパティを調整
  } catch (error: any) {
    console.error("API Route Error:", error.message);

    return NextResponse.json(
      { error: error.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}
