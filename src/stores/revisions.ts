import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

import { calculateMetrics, type RevisionMetrics } from "@/lib/statistics"
import type { Revision, Revisions } from "@/lib/revisions"

/**
 * Derived aggregate metrics computed from the full revision list.
 * These are never persisted — always recalculated from source data.
 */
interface AggregateMetrics extends RevisionMetrics {
    totalQuestionsReviewed: number
}

interface RevisionStore {
    /** Raw revision list — the only data persisted to localStorage */
    revisions: Revision[]

    /** Aggregate metrics derived from the revision list */
    metrics: AggregateMetrics

    addRevision: (rev: Revision) => void
    updateRevision: (index: number, rev: Revision) => void
    deleteRevision: (index: number) => void
    importData: (data: Revisions) => void
    clearData: () => void
}

const EMPTY_METRICS: AggregateMetrics = {
    accuracyRate: 0,
    knowledgeRate: 0,
    marginOfError: 0,
    totalQuestionsReviewed: 0,
}

function deriveMetrics(revisions: Revision[]): AggregateMetrics {
    if (revisions.length === 0) return EMPTY_METRICS

    const totalHits = revisions.reduce((acc, r) => acc + r.hits, 0)
    const totalQuestions = revisions.reduce((acc, r) => acc + r.total, 0)

    return {
        ...calculateMetrics(totalHits, totalQuestions),
        totalQuestionsReviewed: totalHits,
    }
}

export const useRevisionStore = create<RevisionStore>()(
    persist(
        (set, get) => ({
            revisions: [],
            metrics: EMPTY_METRICS,

            addRevision: (rev) => {
                const revisions = [...get().revisions, rev]
                set({ revisions, metrics: deriveMetrics(revisions) })
            },

            updateRevision: (index, rev) => {
                const revisions = get().revisions.map((r, i) => i === index ? rev : r)
                set({ revisions, metrics: deriveMetrics(revisions) })
            },

            deleteRevision: (index) => {
                const revisions = get().revisions.filter((_, i) => i !== index)
                set({ revisions, metrics: deriveMetrics(revisions) })
            },

            importData: (data) => {
                const revisions = data.total ?? []
                set({ revisions, metrics: deriveMetrics(revisions) })
            },

            clearData: () => set({ revisions: [], metrics: EMPTY_METRICS }),
        }),
        {
            name: "revision-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ revisions: state.revisions }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.metrics = deriveMetrics(state.revisions)
                }
            },
        }
    )
)