import type { Revision } from "@/lib/revisions"

const PARTYKIT_HOST = "kity-public-signaling-server.0x41337.partykit.dev"

function roomUrl(code: string): string {
    return `https://${PARTYKIT_HOST}/party/${code}`
}

export function mergeRevisions(local: Revision[], remote: Revision[]): Revision[] {
    const map = new Map<string, Revision>()

    for (const rev of local) {
        map.set(rev.subject, rev)
    }

    for (const rev of remote) {
        const existing = map.get(rev.subject)
        if (!existing || rev.hits > existing.hits) {
            map.set(rev.subject, rev)
        }
    }

    return Array.from(map.values())
}

export function generateCode(): string {
    return Math.floor(100_000 + Math.random() * 900_000).toString()
}

export async function publishSync(code: string, revisions: Revision[]): Promise<void> {
    const res = await fetch(roomUrl(code), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisions }),
    })

    if (!res.ok) throw new Error("Falha ao publicar dados de sincronização.")
}


export async function consumeSync(
    code: string,
    localRevisions: Revision[]
): Promise<Revision[]> {
    const res = await fetch(roomUrl(code))

    if (res.status === 410) throw new Error("Código já utilizado.")
    if (res.status === 404) throw new Error("Código inválido ou expirado.")
    if (!res.ok) throw new Error("Erro ao buscar dados de sincronização.")

    const { revisions: remoteRevisions } = await res.json()
    return mergeRevisions(localRevisions, remoteRevisions)
}