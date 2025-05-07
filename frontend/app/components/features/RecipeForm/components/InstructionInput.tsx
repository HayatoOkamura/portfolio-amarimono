import React from "react";
import { useImageUpload } from "../hooks/useImageUpload";
import { RecipeFormData } from "../types/recipeForm";
import { VALIDATION_MESSAGES } from "../constants/validationMessages";
import { imageBaseUrl } from "@/app/utils/api";
import styles from "./InstructionInput.module.scss";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaCirclePlus } from "react-icons/fa6";
import { FaGripLines, FaTrash } from "react-icons/fa";
import { LuImagePlus } from "react-icons/lu";
import Image from "next/image";
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  listeners?: any;
}

const SortableItem = ({ id, children, listeners }: SortableItemProps) => {
  const { attributes, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {React.cloneElement(children as React.ReactElement, { listeners })}
    </div>
  );
};

interface DragHandleProps {
  id: string;
}

const DragHandle = ({ id }: DragHandleProps) => {
  const { listeners } = useSortable({ id });

  return (
    <button className={styles.instruction_block__drag_handle} {...listeners}>
      <FaGripLines />
    </button>
  );
};

interface InstructionInputProps {
  instructions: RecipeFormData["instructions"];
  onUpdateInstructions: (instructions: RecipeFormData["instructions"]) => void;
}

export const InstructionInput = ({
  instructions = [],
  onUpdateInstructions,
}: InstructionInputProps) => {
  const { handleImageChange, getImageUrl, revokeImageUrl } = useImageUpload();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = instructions.findIndex(
        (_, i) => `step-${i}` === active.id
      );
      const newIndex = instructions.findIndex(
        (_, i) => `step-${i}` === over.id
      );

      const newInstructions = [...instructions];
      const [movedItem] = newInstructions.splice(oldIndex, 1);
      newInstructions.splice(newIndex, 0, movedItem);

      // ステップ番号を更新
      const updatedInstructions = newInstructions.map((step, index) => ({
        ...step,
        step: index + 1,
      }));

      onUpdateInstructions(updatedInstructions);
    }
  };

  const handleDeleteInstruction = (index: number) => {
    if (instructions.length === 1) {
      alert(VALIDATION_MESSAGES.MIN_INSTRUCTIONS);
      return;
    }

    const updatedInstructions = instructions
      .filter((_, i) => i !== index)
      .map((step, i) => ({
        step: i + 1,
        description: step.description,
        imageURL: step.imageURL,
      }));

    onUpdateInstructions(updatedInstructions);
  };

  return (
    <div className={styles.instruction_block}>
      <div className={styles.instruction_block__container}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={instructions.map((_, index) => `step-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            {instructions.map((instruction, index) => (
              <SortableItem key={`step-${index}`} id={`step-${index}`}>
                <div className={styles.instruction_block__step}>
                  <div className={styles.instruction_block__header}>
                    <div className={styles.instruction_block__step_number}>
                      {instruction.step}
                    </div>
                    <div className={styles.instruction_block__actions}>
                      <DragHandle id={`step-${index}`} />
                      <button
                        className={styles.instruction_block__delete}
                        onClick={() => handleDeleteInstruction(index)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className={styles.instruction_block__image_container}>
                    {instruction.imageURL ? (
                      <>
                        <Image
                          src={
                            instruction.imageURL instanceof File
                              ? URL.createObjectURL(instruction.imageURL)
                              : typeof instruction.imageURL === "string" &&
                                instruction.imageURL.startsWith("http")
                              ? instruction.imageURL
                              : typeof instruction.imageURL === "string"
                              ? `${imageBaseUrl}/${instruction.imageURL}`
                              : ""
                          }
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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const updatedInstructions = instructions.map(
                                (step, i) =>
                                  i === index
                                    ? {
                                        ...step,
                                        imageURL: file,
                                      }
                                    : step
                              );
                              onUpdateInstructions(updatedInstructions);
                            }
                          }}
                          className={styles.instruction_block__image_input}
                        />
                      </>
                    ) : (
                      <div className={styles.instruction_block__placeholder}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const updatedInstructions = instructions.map(
                                (step, i) =>
                                  i === index
                                    ? {
                                        ...step,
                                        imageURL: file,
                                      }
                                    : step
                              );
                              onUpdateInstructions(updatedInstructions);
                            }
                          }}
                          className={styles.instruction_block__image_input}
                        />
                        <div
                          className={
                            styles.instruction_block__placeholder_content
                          }
                        >
                          <div className={styles.instruction_block__icon}>
                            <LuImagePlus />
                          </div>
                          <div
                            className={styles.instruction_block__upload_text}
                          >
                            <label
                              className={styles.instruction_block__upload_label}
                            >
                              手順の画像を<br />アップロード
                            </label>
                          </div>
                          <p className={styles.instruction_block__file_info}>
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.instruction_block__controls}>
                    <textarea
                      placeholder={`Step ${instruction.step}`}
                      value={instruction.description}
                      onChange={(e) =>
                        onUpdateInstructions(
                          instructions.map((step, i) =>
                            i === index
                              ? { ...step, description: e.target.value }
                              : step
                          )
                        )
                      }
                      className={styles.instruction_block__textarea}
                    />
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <button
        onClick={() =>
          onUpdateInstructions([
            ...instructions,
            {
              step: instructions.length + 1,
              description: "",
              imageURL: undefined,
            },
          ])
        }
        className={styles.instruction_block__add}
      >
        <FaCirclePlus />
        手順を追加
      </button>
    </div>
  );
};
