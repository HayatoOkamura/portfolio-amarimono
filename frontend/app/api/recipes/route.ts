/* eslint-disable */
import { NextResponse } from "next/server";

interface Ingredient {
  id: number;
  name: string;
  quantity: number;
}

interface Recipe {
  id: number;
  name: string;
  instructions: string;
}

async function fetchFromBackend(ingredients: Ingredient[]): Promise<Recipe[]> {
  console.log("Request payload to Go API:", JSON.stringify(ingredients));
  const response = await fetch("http://backend:8080/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ingredients),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response body from Go API:", errorText);
    throw new Error(`Backend Error: ${response.status} - ${errorText}`);
  }
  const responseData = await response.json();

  return responseData;
}

export async function POST(request: Request) {
  try {
    const ingredients: Ingredient[] = await request.json();
    const recipes = await fetchFromBackend(ingredients); // 分離した関数の利用
    return NextResponse.json(recipes);
  } catch (error: any) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch recipes." },
      { status: 500 }
    );
  }
}
