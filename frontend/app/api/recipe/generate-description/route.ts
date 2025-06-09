import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { recipeName } = await request.json();

    if (!recipeName) {
      return NextResponse.json(
        { error: "Recipe name is required" },
        { status: 400 }
      );
    }

    const prompt = `以下のレシピ名に基づいて、キャッチフレーズとレシピ説明を生成してください。
レシピ名: ${recipeName}

以下の形式でJSONを返してください:
{
  "catchphrase": "キャッチフレーズ（30文字程度）",
  "summary": "レシピ説明（200文字程度）"
}

キャッチフレーズは簡潔で魅力的な一文にしてください。
レシピ説明は、料理の特徴、調理のポイント、味わいなどを含めて説明してください。`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const response = JSON.parse(content);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating description:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}