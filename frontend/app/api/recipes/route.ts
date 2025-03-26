import { NextResponse } from "next/server";
import { backendUrl } from "@/app/utils/apiUtils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const query = searchParams.get("q");

    let url = `${backendUrl}/api/recipes`;
    if (id) {
      url += `/${id}`;
    } else if (query) {
      url = `${backendUrl}/api/recipes/search?q=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const response = await fetch(`${backendUrl}/admin/recipes`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error adding recipe:", error);
    return NextResponse.json({ error: "Failed to add recipe" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const response = await fetch(`${backendUrl}/admin/recipes/${id}`, {
      method: "PUT",
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating recipe:", error);
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const response = await fetch(`${backendUrl}/admin/recipes/${id}`, {
      method: "DELETE",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 });
  }
} 