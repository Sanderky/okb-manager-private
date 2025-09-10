
export interface Construction {
    id: string,
    name: string,
    location: string,
    contractor: string,
    startDate: Date,
    endDate?: Date,
    inProgress: boolean,
    notes?: string
}