export interface Lodging {
  id: string;
  name?: string;
  address?: string;
  startDate: Date;
  endDate: Date;
  employeeIds: string[];
  description?: string;
  constructionSiteId?: string | null;
}

export interface LodgingAssignment {
  employeeId: string;
  startDate: Date;
  endDate: Date;
}

export type ExtendedLodging = Lodging & {
  constructionSiteId?: string | null;
  assignments?: {
    employeeId: string;
    startDate: string | Date;
    endDate: string | Date;
  }[];
};