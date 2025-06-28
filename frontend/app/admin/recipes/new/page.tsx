/* eslint-disable */
"use client";

import { useRouter } from "next/navigation";
import { RegistrationForm } from "@/app/components/features/RecipeForm/RegistrationForm";

const AdminRecipeNew = () => {
  return (
    <div>

      <RegistrationForm isAdmin={true} />
    </div>
  );
};

export default AdminRecipeNew; 