
export interface Construction {
    name: string,
    location: string,
    contractor: string,
    startDate: Date,
    endDate?: Date,
    inProgress: boolean,
    notes?: string
}