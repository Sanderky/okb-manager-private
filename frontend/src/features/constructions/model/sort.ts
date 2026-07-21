import type { Construction } from "@/entities/construction";

export const sortConstructions = (
  constructions: Construction[]
): Construction[] => {
  return [...constructions].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
};