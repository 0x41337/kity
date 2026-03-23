// @ts-check
/** @typedef {import("partykit/server").Room} Room */
/** @typedef {import("partykit/server").Server} Server */

const CODE_TTL_MS = 10 * 60 * 1000 // 10m

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


class PartyServer {
    /** @param {Room} room */
    constructor(room) {
        this.room = room
    }

    /** @param {Request} req */
    async onRequest(req) {
        const { method } = req

        if (method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CORS_HEADERS })
        }

        if (method === "POST") {
            const body = await req.json()
            await this.room.storage.put("payload", body)
            await this.room.storage.put("used", false)
            await this.room.storage.setAlarm(Date.now() + CODE_TTL_MS)
            return Response.json({ ok: true }, { headers: CORS_HEADERS })
        }

        if (method === "GET") {
            const used = await this.room.storage.get("used")

            if (used) {
                return Response.json({ error: "code_used" }, { status: 410, headers: CORS_HEADERS })
            }

            const payload = await this.room.storage.get("payload")

            if (!payload) {
                return Response.json({ error: "not_found" }, { status: 404, headers: CORS_HEADERS })
            }

            await this.room.storage.put("used", true)

            return Response.json(payload, { headers: CORS_HEADERS })
        }

        return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS })
    }

    async onAlarm() {
        await this.room.storage.deleteAll()
    }
}

export default PartyServer