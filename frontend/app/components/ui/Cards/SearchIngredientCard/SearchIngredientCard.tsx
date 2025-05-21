"use client";

import React, { useEffect } from "react";
import { Ingredient } from "@/app/types/index";
import useIngredientStore from "@/app/stores/ingredientStore";
import { useUpdateIngredientQuantity } from "@/app/hooks/ingredients";
import { useIngredientDefaults, useUserIngredientDefaults } from "@/app/hooks/userIngredientDefaults";
import { useAuth } from "@/app/hooks/useAuth";
import IngredientCard from "../IngredientCard/IngredientCard";

interface DefaultIngredient {
  ingredient_id: number;
  default_quantity: number;
}

export interface IngredientCardProps {
  ingredient: Ingredient;
}

const SearchIngredientCard: React.FC<IngredientCardProps> = ({ ingredient }) => {
  const { mutate: updateQuantity } = useUpdateIngredientQuantity();
  const ingredients = useIngredientStore((state) => state.ingredients);
  const currentIngredient = ingredients.find(i => i.id === ingredient.id);
  const currentQuantity = currentIngredient?.quantity || 0;
  const isPresence = ingredient.unit.name === 'presence';
  const { user } = useAuth();
  
  const { data: ingredientDefaults } = useIngredientDefaults();
  const { data: userIngredientDefaults } = useUserIngredientDefaults();
  
  useEffect(() => {
    const defaults = user ? userIngredientDefaults : ingredientDefaults;
    
    if (defaults && defaults.length > 0) {
      const defaultIngredient = defaults.find(function(item: DefaultIngredient) {
        return item.ingredient_id === ingredient.id;
      });
      
      if (defaultIngredient && defaultIngredient.default_quantity > 0 && !currentQuantity) {
        updateQuantity({
          ...ingredient,
          quantity: defaultIngredient.default_quantity,
          unit: {
            ...ingredient.unit,
            type: isPresence ? 'presence' : 'quantity'
          }
        });
      }
    }
  }, [ingredientDefaults, userIngredientDefaults, user, ingredient.id, currentQuantity, updateQuantity, ingredient, isPresence]);
  
  const handleQuantityUpdate = (id: number, delta: number): void => {
    if (isPresence) {
      if (delta > 0 && !currentQuantity) {
        updateQuantity({ 
          ...ingredient,
          quantity: 1,
          unit: {
            ...ingredient.unit,
            type: 'presence'
          }
        });
      } else if (delta < 0 && currentQuantity) {
        updateQuantity({ 
          ...ingredient,
          quantity: 0,
          unit: {
            ...ingredient.unit,
            type: 'presence'
          }
        });
      }
      return;
    }

    const newQuantity = Math.max(0, currentQuantity + delta);
    if (newQuantity > 0 || currentQuantity > 0) {
      updateQuantity({ 
        ...ingredient,
        quantity: newQuantity,
        unit: {
          ...ingredient.unit,
          type: 'quantity'
        }
      });
    }
  };

  return (
    <IngredientCard
      ingredient={ingredient}
      currentQuantity={currentQuantity}
      isPresence={isPresence}
      onQuantityChange={handleQuantityUpdate}
    />
  );
};

export default SearchIngredientCard;
