import * as Y from "yjs"
import { WebrtcProvider } from "y-webrtc"
import { create } from "zustand"
import { useRevisionStore } from "@/stores/revisions"
import type { Revision } from "@/lib/revisions"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIGNALING_SERVER = "wss://kity-public-signaling-server.0x41337.partykit.dev/party/server"
const YMAP_KEY = "revisions"
const PEER_POLL_INTERVAL_MS = 5_000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncStatus = "idle" | "connecting" | "connected" | "error"

interface SyncStore {
    status: SyncStatus
    roomId: string | null
    peerCount: number
    startSync: (roomId: string) => void
    stopSync: () => void
}

type PeersEvent = {
    added: string[]
    removed: string[]
    webrtcPeers: string[]
    bcPeers: string[]
}


let ydoc: Y.Doc | null = null
let provider: WebrtcProvider | null = null
let yStore: Y.Map<string> | null = null
let unsubscribeZustand: (() => void) | null = null
let peerPollInterval: ReturnType<typeof setInterval> | null = null

let applyingRemote = false

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function teardown(): void {
    if (peerPollInterval !== null) {
        clearInterval(peerPollInterval)
        peerPollInterval = null
    }
    unsubscribeZustand?.()
    unsubscribeZustand = null

    provider?.destroy()
    provider = null

    ydoc?.destroy()
    ydoc = null

    yStore = null
    applyingRemote = false
}

function pushToYjs(revisions: Revision[]): void {
    if (!yStore) return
    yStore.set(YMAP_KEY, JSON.stringify(revisions))
}

function getAwarenessPeerCount(): number {
    if (!provider) return 0
    return Math.max(0, provider.awareness.getStates().size - 1)
}

// ---------------------------------------------------------------------------
// Zustand sync store
// ---------------------------------------------------------------------------
export const useSyncStore = create<SyncStore>((set) => ({
    status: "idle",
    roomId: null,
    peerCount: 0,

    startSync: (roomId: string) => {
        teardown()
        set({ status: "connecting", roomId, peerCount: 0 })

        ydoc = new Y.Doc()
        yStore = ydoc.getMap<string>("store")

        provider = new WebrtcProvider(roomId, ydoc, {
            signaling: [SIGNALING_SERVER],
        })

        provider.on("peers", ({ webrtcPeers, bcPeers }: PeersEvent) => {
            const peerCount = webrtcPeers.length + bcPeers.length
            set({ peerCount, status: peerCount > 0 ? "connected" : "connecting" })
        })

        peerPollInterval = setInterval(() => {
            if (!provider) return

            const peerCount = getAwarenessPeerCount()
            const status: SyncStatus = peerCount > 0 ? "connected" : "connecting"

            useSyncStore.setState((prev) =>
                prev.peerCount === peerCount && prev.status === status
                    ? prev
                    : { peerCount, status }
            )
        }, PEER_POLL_INTERVAL_MS)

        // ── Remote → Zustand ────────────────────────────────────────────────
        yStore.observe((event) => {
            if (!event.keysChanged.has(YMAP_KEY) || applyingRemote || !yStore) return

            const raw = yStore.get(YMAP_KEY)
            if (!raw) return

            let remoteRevisions: Revision[]
            try {
                remoteRevisions = JSON.parse(raw)
            } catch {
                return
            }

            const store = useRevisionStore.getState()
            if (JSON.stringify(store.revisions) === JSON.stringify(remoteRevisions)) return

            applyingRemote = true
            store.importData({ total: remoteRevisions } as any)
            applyingRemote = false
        })

        // ── Zustand → Remote ────────────────────────────────────────────────
        unsubscribeZustand = useRevisionStore.subscribe((state) => {
            if (applyingRemote) return
            pushToYjs(state.revisions)
        })

        pushToYjs(useRevisionStore.getState().revisions)
    },

    stopSync: () => {
        teardown()
        set({ status: "idle", roomId: null, peerCount: 0 })
    },
}))

// ---------------------------------------------------------------------------
// Auto-join from URL
// ---------------------------------------------------------------------------
export function initSyncFromUrl(): void {
    const roomId = new URLSearchParams(window.location.search).get("room")
    if (roomId) {
        useSyncStore.getState().startSync(roomId)
    }
}