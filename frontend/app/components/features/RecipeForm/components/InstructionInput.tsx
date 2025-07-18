"use client";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useImageUpload } from "../hooks/useImageUpload";
import styles from "./InstructionInput.module.scss";
import { imageBaseUrl } from "@/app/utils/api";
import OptimizedImage from "@/app/components/ui/OptimizedImage/OptimizedImage";

interface Instruction {
  step: number;
  description: string;
  imageURL?: string | File;
}

interface InstructionInputProps {
  instructions: Instruction[];
  onInstructionsChange: (instructions: Instruction[]) => void;
}

export const InstructionInput = ({
  instructions,
  onInstructionsChange,
}: InstructionInputProps) => {
  const { handleImageChange } = useImageUpload();

  const addInstruction = () => {
    const newInstruction: Instruction = {
      step: instructions.length + 1,
      description: "",
    };
    onInstructionsChange([...instructions, newInstruction]);
  };

  const removeInstruction = (index: number) => {
    const updatedInstructions = instructions
      .filter((_, i) => i !== index)
      .map((instruction, i) => ({
        ...instruction,
        step: i + 1,
      }));
    onInstructionsChange(updatedInstructions);
  };

  const updateInstruction = (index: number, field: keyof Instruction, value: string) => {
    const updatedInstructions = [...instructions];
    updatedInstructions[index] = {
      ...updatedInstructions[index],
      [field]: value,
    };
    onInstructionsChange(updatedInstructions);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const result = await handleImageChange(e);
    if (result) {
      const updatedInstructions = [...instructions];
      updatedInstructions[index] = {
        ...updatedInstructions[index],
        imageURL: result.image,
      };
      onInstructionsChange(updatedInstructions);
    }
  };

  const getImageUrl = (imageURL: string | File | undefined): string => {
    if (!imageURL) return "";
    if (imageURL instanceof File) {
      return URL.createObjectURL(imageURL);
    }
    if (typeof imageURL === "string" && imageURL.startsWith("http")) {
      return imageURL;
    }
    if (typeof imageURL === "string") {
      return `${imageBaseUrl}/${imageURL}`;
    }
    return "";
  };

  return (
    <div className={styles.instruction_block}>
      <h3 className={styles.instruction_block__title}>作り方</h3>
      {instructions.map((instruction, index) => (
        <div key={index} className={styles.instruction_block__item}>
          <div className={styles.instruction_block__header}>
            <span className={styles.instruction_block__step}>
              ステップ {instruction.step}
            </span>
            {instructions.length > 1 && (
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                className={styles.instruction_block__remove}
              >
                削除
              </button>
            )}
          </div>
          <div className={styles.instruction_block__content}>
            <textarea
              value={instruction.description}
              onChange={(e) =>
                updateInstruction(index, "description", e.target.value)
              }
              placeholder="作り方を入力してください"
              className={styles.instruction_block__textarea}
              rows={3}
            />
            <div className={styles.instruction_block__image_container}>
              {instruction.imageURL ? (
                <>
                  <OptimizedImage
                    src={getImageUrl(instruction.imageURL)}
                    alt={`Step ${instruction.step}`}
                    className={styles.instruction_block__image}
                    width={100}
                    height={100}
                  />
                  <div
                    className={styles.instruction_block__image_overlay}
                  >
                    <span
                      className={styles.instruction_block__image_text}
                    >
                      画像を変更
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, index)}
                    className={styles.instruction_block__image_input}
                  />
                </>
              ) : (
                <div className={styles.instruction_block__image_placeholder}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, index)}
                    className={styles.instruction_block__image_input}
                  />
                  <span className={styles.instruction_block__image_placeholder_text}>
                    画像を追加
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addInstruction}
        className={styles.instruction_block__add}
      >
        ステップを追加
      </button>
    </div>
  );
};
