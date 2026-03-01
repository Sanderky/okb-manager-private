import type { Employee } from "@/entities/employee";

export interface FieldInfo {
  key: keyof Employee;
  label: string;
}