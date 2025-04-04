/* eslint-disable */
import { backendUrl, handleApiResponse } from "../utils/apiUtils";
import { Unit } from "../types/index";

// 単位(Unit)一覧を取得
export const fetchUnitsService = async (): Promise<Unit[]> => {
  const res = await fetch(`${backendUrl}/admin/units`);
  const data = await handleApiResponse(res);

  return data.map((unit: any) => ({
    id: unit.id,
    name: unit.name,
    description: unit.description,
    step: unit.step
  }));
};
