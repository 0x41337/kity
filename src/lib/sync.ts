import type { Revision } from "@/lib/revisions"

const PARTYKIT_HOST = "kity-public-signaling-server.0x41337.partykit.dev"

// Retorna array completo — incluindo deletados — para o store decidir o que mostrar
export function mergeRevisions(local: Revision[], remote: Revision[]): Revision[] {
    const map = new Map<string, Revision>()

    for (const rev of local) map.set(rev.subject, rev)

    for (const rev of remote) {
        const existing = map.get(rev.subject)
        if (!existing) {
            map.set(rev.subject, rev)
            continue
        }
        const existingTs = existing.updatedAt ?? 0
        const remoteTs = rev.updatedAt ?? 0
        if (remoteTs > existingTs) {
            map.set(rev.subject, rev)
        }
    }

    return Array.from(map.values())
}

export function getOrCreateUserId(): string {
    const key = "kity-user-id"
    let id = localStorage.getItem(key)
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem(key, id)
    }
    return id
}

export function setUserId(id: string): void {
    localStorage.setItem("kity-user-id", id)
}

function roomUrl(code: string): string {
    return `https://${PARTYKIT_HOST}/party/${code}`
}

export function generateCode(): string {
    return Math.floor(100_000 + Math.random() * 900_000).toString()
}

export async function publishSync(code: string, revisions: Revision[], userId: string): Promise<void> {
    const res = await fetch(roomUrl(code), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisions, userId }),
    })
    if (!res.ok) throw new Error("Falha ao publicar dados de sincronização.")
}

export async function consumeSync(
    code: string,
    localRevisions: Revision[]
): Promise<{ revisions: Revision[], userId: string }> {
    const res = await fetch(roomUrl(code))
    if (res.status === 410) throw new Error("Código já utilizado.")
    if (res.status === 404) throw new Error("Código inválido ou expirado.")
    if (!res.ok) throw new Error("Erro ao buscar dados de sincronização.")
    const { revisions: remoteRevisions, userId } = await res.json()
    return {
        revisions: mergeRevisions(localRevisions, remoteRevisions),
        userId,
    }
}

type SyncHandler = (revisions: Revision[]) => void

export interface SyncSocket {
    push: (revisions: Revision[]) => void
    close: () => void
}

export function createSyncSocket(
    userId: string,
    onSync: SyncHandler
): SyncSocket {
    let ws: WebSocket
    let destroyed = false
    let retryCount = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    const queue: string[] = []

    function connect() {
        if (destroyed) return

        ws = new WebSocket(`wss://${PARTYKIT_HOST}/party/${userId}`)

        ws.addEventListener("open", () => {
            if (destroyed) { ws.close(); return }
            retryCount = 0
            while (queue.length > 0) ws.send(queue.shift()!)
        })

        ws.addEventListener("message", (event) => {
            if (destroyed) return
            try {
                const data = JSON.parse(event.data)
                if (data.type === "sync" && Array.isArray(data.revisions)) {
                    onSync(data.revisions)
                }
            } catch {
                console.warn("Mensagem de sync inválida:", event.data)
            }
        })

        ws.addEventListener("close", () => {
            if (destroyed) return
            const delay = Math.min(1000 * 2 ** retryCount, 30_000)
            retryCount++
            retryTimer = setTimeout(connect, delay)
        })

        ws.addEventListener("error", () => {
            ws.close()
        })
    }

    connect()

    return {
        push(revisions: Revision[]) {
            if (destroyed) return
            const message = JSON.stringify({ type: "push", revisions })
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message)
            } else {
                queue.push(message)
            }
        },
        close() {
            destroyed = true
            if (retryTimer !== null) {
                clearTimeout(retryTimer)
                retryTimer = null
            }
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close()
            }
        },
    }
}