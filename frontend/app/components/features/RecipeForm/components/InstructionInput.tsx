import { useImageUpload } from "../hooks/useImageUpload";
import { RecipeFormData } from "../types/recipeForm";
import { VALIDATION_MESSAGES } from "../constants/validationMessages";
import { backendUrl } from "@/app/utils/apiUtils";

interface InstructionInputProps {
  instructions: RecipeFormData["instructions"];
  onUpdateInstructions: (instructions: RecipeFormData["instructions"]) => void;
}

export const InstructionInput = ({
  instructions = [],
  onUpdateInstructions,
}: InstructionInputProps) => {
  const { handleImageChange, getImageUrl, revokeImageUrl } = useImageUpload();

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
    <div>
      {instructions.map((instruction, index) => (
        <div key={index} className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2">
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
              className="border p-2 w-full rounded text-gray-700"
            ></textarea>
            <button
              onClick={() => handleDeleteInstruction(index)}
              className="bg-red-500 text-white px-2 py-1 rounded h-10"
            >
              削除
            </button>
          </div>
          <div className="relative">
            {instruction.imageURL ? (
              <div className="relative group">
                <img
                  src={
                    instruction.imageURL instanceof File
                      ? URL.createObjectURL(instruction.imageURL)
                      : typeof instruction.imageURL === 'string' && instruction.imageURL.startsWith('http')
                      ? instruction.imageURL
                      : typeof instruction.imageURL === 'string'
                      ? `${backendUrl}/uploads/${instruction.imageURL}`
                      : ""
                  }
                  alt={`Step ${instruction.step}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    画像を変更
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const updatedInstructions = instructions.map((step, i) =>
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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                画像なし
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const updatedInstructions = instructions.map((step, i) =>
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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      ))}
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
        className="bg-green-500 text-white px-4 py-2 rounded w-full mb-2"
      >
        Add Step
      </button>
    </div>
  );
}; 