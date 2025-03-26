import { NextResponse } from "next/server";
import { backendUrl } from "@/app/utils/apiUtils";

export async function GET() {
  try {
    const response = await fetch(`${backendUrl}/admin/ingredients`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return NextResponse.json({ error: "Failed to fetch ingredients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const response = await fetch(`${backendUrl}/admin/ingredients`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error adding ingredient:", error);
    return NextResponse.json({ error: "Failed to add ingredient" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const response = await fetch(`${backendUrl}/admin/ingredients/${id}`, {
      method: "PATCH",
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating ingredient:", error);
    return NextResponse.json({ error: "Failed to update ingredient" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const response = await fetch(`${backendUrl}/admin/ingredients/${id}`, {
      method: "DELETE",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    return NextResponse.json({ error: "Failed to delete ingredient" }, { status: 500 });
  }
} 