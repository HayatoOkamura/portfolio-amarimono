import { useQuery } from "@tanstack/react-query";
import { Unit } from "@/app/types/index";
import { backendUrl } from "../utils/api";

export const useUnits = () => {
  return useQuery<Unit[]>({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await fetch(`${backendUrl}/admin/units`);
      if (!response.ok) {
        throw new Error("Failed to fetch units");
      }
      return response.json();
    },
  });
}; 