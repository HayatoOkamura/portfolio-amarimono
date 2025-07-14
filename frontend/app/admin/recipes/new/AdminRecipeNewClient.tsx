"use client";

import { RegistrationForm } from "@/app/components/features/RecipeForm/RegistrationForm";

const AdminRecipeNewClient = () => {
  return (
    <div>
      <RegistrationForm isAdmin={true} />
    </div>
  );
};

export default AdminRecipeNewClient; 