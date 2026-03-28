export interface Revision {
    hits: number
    total: number
    group?: string
    subject: string
    updatedAt?: number
    deletedAt?: number
}

export type Revisions = {
    total: Revision[]
    knowledgeRateMean: number
    totalQuestionsReviewed: number
    generalProficiencyIndex: number
}