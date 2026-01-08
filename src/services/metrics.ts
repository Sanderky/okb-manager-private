import { supabase } from "../supabase";
import type { DiskUsage } from "../types";

export const getDiskUsage = async (): Promise<DiskUsage> => {
  const { data, error } = await supabase.functions.invoke('disk-usage');
  if (error) throw error;
  return data;
};