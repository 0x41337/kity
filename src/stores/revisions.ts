import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

import { calculateMetrics, type RevisionMetrics } from "@/lib/statistics"
import type { Revision, Revisions } from "@/lib/revisions"
import {
    mergeRevisions,
    getOrCreateUserId,
    setUserId,
    createSyncSocket,
    generateCode,
    publishSync,
    consumeSync,
    type SyncSocket,
} from "@/lib/sync"

interface AggregateMetrics extends RevisionMetrics {
    totalQuestions: number
    totalQuestionsReviewed: number
}

interface RevisionStore {
    // array interno — inclui deletados, usado para merge e sync
    _revisions: Revision[]
    // array visível — filtrado, usado pela UI
    revisions: Revision[]
    metrics: AggregateMetrics

    _ws: SyncSocket | null
    _userId: string | null

    addRevision: (rev: Revision) => void
    updateRevision: (index: number, rev: Revision) => void
    deleteRevision: (index: number) => void
    importData: (data: Revisions) => void
    clearData: () => void

    syncPublish: () => Promise<string>
    syncConsume: (code: string) => Promise<void>

    initSync: () => void
    disconnectSync: () => void
    desync: () => void
}

const EMPTY_METRICS: AggregateMetrics = {
    accuracyRate: 0,
    knowledgeRate: 0,
    marginOfError: 0,
    totalQuestions: 0,
    totalQuestionsReviewed: 0,
}

function deriveMetrics(revisions: Revision[]): AggregateMetrics {
    if (revisions.length === 0) return EMPTY_METRICS
    const totalHits = revisions.reduce((acc, r) => acc + r.hits, 0)
    const totalQuestions = revisions.reduce((acc, r) => acc + r.total, 0)
    return {
        ...calculateMetrics(totalHits, totalQuestions),
        totalQuestions,
        totalQuestionsReviewed: totalHits,
    }
}

// Aplica um novo array interno e deriva o estado visível
function applyRevisions(all: Revision[]) {
    const visible = all.filter(r => !r.deletedAt)
    return {
        _revisions: all,
        revisions: visible,
        metrics: deriveMetrics(visible),
    }
}

export const useRevisionStore = create<RevisionStore>()(
    persist(
        (set, get) => ({
            _revisions: [],
            revisions: [],
            metrics: EMPTY_METRICS,
            _ws: null,
            _userId: null,

            addRevision: (rev) => {
                const stamped = { ...rev, updatedAt: Date.now() }
                const all = [...get()._revisions, stamped]
                set(applyRevisions(all))
                get()._ws?.push(all)
            },

            updateRevision: (index, rev) => {
                const stamped = { ...rev, updatedAt: Date.now() }
                // index é relativo ao array visível — precisa mapear para o interno
                const visibleIndex = get().revisions[index]?.subject
                const all = get()._revisions.map(r =>
                    r.subject === visibleIndex ? stamped : r
                )
                set(applyRevisions(all))
                get()._ws?.push(all)
            },

            deleteRevision: (index) => {
                const subject = get().revisions[index]?.subject
                const all = get()._revisions.map(r =>
                    r.subject === subject
                        ? { ...r, deletedAt: Date.now(), updatedAt: Date.now() }
                        : r
                )
                set(applyRevisions(all))
                get()._ws?.push(all)
            },

            importData: (data) => {
                const all = (data.total ?? []).map(r => ({
                    ...r,
                    updatedAt: r.updatedAt ?? Date.now(),
                }))
                set(applyRevisions(all))
                get()._ws?.push(all)
            },

            clearData: () => {
                set({ _revisions: [], revisions: [], metrics: EMPTY_METRICS })
                get()._ws?.push([])
            },

            syncPublish: async () => {
                const code = generateCode()
                const userId = getOrCreateUserId()
                await publishSync(code, get()._revisions, userId)
                return code
            },

            syncConsume: async (code) => {
                const { revisions, userId } = await consumeSync(code, get()._revisions)
                setUserId(userId)
                set(applyRevisions(revisions))
                get().initSync()
            },

            initSync: () => {
                const existing = get()._ws
                if (existing) existing.close()

                const userId = getOrCreateUserId()

                const ws = createSyncSocket(userId, (remoteRevisions) => {
                    const merged = mergeRevisions(get()._revisions, remoteRevisions)
                    set(applyRevisions(merged))
                })

                set({ _ws: ws, _userId: userId })
            },

            disconnectSync: () => {
                get()._ws?.close()
                set({ _ws: null })
            },

            desync: () => {
                get()._ws?.close()
                localStorage.removeItem("kity-user-id")
                get().initSync()
            },
        }),
        {
            name: "revision-storage",
            storage: createJSONStorage(() => localStorage),
            // Persiste o array interno completo (com deletados)
            partialize: (state) => ({ _revisions: state._revisions }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    const visible = state._revisions.filter(r => !r.deletedAt)
                    state.revisions = visible
                    state.metrics = deriveMetrics(visible)
                }
            },
        }
    )
)