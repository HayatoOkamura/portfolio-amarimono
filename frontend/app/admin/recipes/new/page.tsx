/* eslint-disable */
"use client";

import { useRouter } from "next/navigation";
import { RegistrationForm } from "@/app/components/features/RecipeForm/RegistrationForm";

const AdminRecipeNew = () => {
  const router = useRouter();

  return (
    <div>

      <RegistrationForm isAdmin={true} />
    </div>
  );
};

export default AdminRecipeNew; 