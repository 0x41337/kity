// @ts-check
/** @typedef {import("partykit/server").Room} Room */
/** @typedef {import("partykit/server").Server} Server */
/** @typedef {import("partykit/server").Connection} Connection */
/** @typedef {import("partykit/server").ConnectionContext} ConnectionContext */

/**
 * Signaling server for y-webrtc.
 *
 *
 * @implements {Server}
 */
class PartyServer {
    /** @param {Room} room */
    constructor(room) {
        this.room = room
    }

    /**
     * @param {Connection} _conn
     * @param {ConnectionContext} _ctx
     */
    onConnect(_conn, _ctx) { }

    /**
     * @param {ArrayBuffer | string} message
     * @param {Connection} sender
     */
    onMessage(message, sender) {
        this.room.broadcast(message, [sender.id])
    }

    /** @param {Connection} _conn */
    onClose(_conn) { }

    /**
     * @param {Connection} _conn
     * @param {Error} error
     */
    onError(_conn, error) {
        console.error("[PartyServer] connection error:", error)
    }
}

export default PartyServer