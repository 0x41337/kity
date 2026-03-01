export interface Revision {
    hits: number
    total: number
    subject: string
}

export type Revisions = {
    total: Revision[]
    knowledgeRateMean: number
    totalQuestionsReviewed: number
    generalProficiencyIndex: number
}
