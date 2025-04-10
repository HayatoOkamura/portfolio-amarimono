/* eslint-disable */
"use client";

import { useRouter } from "next/navigation";
import { RegistrationForm } from "@/app/components/features/RecipeForm/RegistrationForm";

const AdminRecipeNew = () => {
  const router = useRouter();

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Add New Recipe</h2>
        <button
          onClick={() => router.back()}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>

      <RegistrationForm isAdmin={true} />
    </div>
  );
};

export default AdminRecipeNew; 