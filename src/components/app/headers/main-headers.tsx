import { toast } from "sonner"
import { useRef, useState } from "react"

import UUID from "pure-uuid"

import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

import { useTheme } from "@/providers/theme-provider"
import { useRevisionStore } from "@/stores/revisions"
import { useSyncStore, type SyncStatus } from "@/stores/sync-store"

import {
    Settings,
    Sun,
    Moon,
    Monitor,
    Download,
    Upload,
    Share2,
    Wifi,
    WifiOff,
    Loader2,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRoomUrl(roomId: string): string {
    const url = new URL(window.location.href)
    url.search = ""
    url.searchParams.set("room", roomId)
    return url.toString()
}


// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SyncStatusIcon({ status }: { status: SyncStatus }) {
    if (status === "connecting") return <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    if (status === "connected") return <Wifi className="h-4 w-4 mr-2" />
    if (status === "error") return <WifiOff className="h-4 w-4 mr-2" />
    return <Share2 className="h-4 w-4 mr-2" />
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MainHeader() {
    const { setTheme } = useTheme()
    const importInputRef = useRef<HTMLInputElement>(null)
    const [roomDialogOpen, setRoomDialogOpen] = useState(false)

    const revisions = useRevisionStore((s) => s.revisions)
    const importData = useRevisionStore((s) => s.importData)

    const { status, roomId, peerCount, startSync, stopSync } = useSyncStore()
    const isSyncing = status !== "idle"
    const roomUrl = roomId ? buildRoomUrl(roomId) : ""

    // ── Export ──────────────────────────────────────────────────────────────

    const handleExport = () => {
        const json = JSON.stringify({ total: revisions }, null, 2)
        const url = URL.createObjectURL(new Blob([json], { type: "application/json" }))
        const a = Object.assign(document.createElement("a"), {
            href: url,
            download: `kity-backup-${new Date().toISOString().slice(0, 10)}.json`,
        })
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Revisões exportadas com sucesso!")
    }

    // ── Import ──────────────────────────────────────────────────────────────

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = ({ target }) => {
            try {
                importData(JSON.parse(target?.result as string))
                toast.success("Revisões importadas com sucesso!")
            } catch {
                toast.error("Arquivo inválido.")
            }
        }
        reader.readAsText(file)
        e.target.value = ""
    }

    // ── Sync ────────────────────────────────────────────────────────────────

    const handleStartSync = () => {
        const newRoomId = new UUID(4).toString()
        const link = buildRoomUrl(newRoomId)

        startSync(newRoomId)
        window.history.pushState({}, "", link)
        toast.success("Sincronização iniciada!")
    }

    const handleStopSync = () => {
        stopSync()
        window.history.pushState({}, "", window.location.pathname)
        toast.info("Sincronização encerrada.")
    }


    const syncLabel =
        status === "connecting" ? "Aguardando conexão…"
            : status === "connected" ? `Conectado (${peerCount} dispositivo${peerCount !== 1 ? "s" : ""})`
                : "Sincronizar"

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <header className="flex items-center justify-between w-full border-b py-5">
                <div className="px-5">
                    <a href="/">
                        <h1 className="text-xl font-extrabold tracking-tight">Kity</h1>
                    </a>
                </div>

                <div className="px-5">
                    <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={handleImport}
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Tema</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => setTheme("light")}>
                                <Sun className="h-4 w-4 mr-2" /> Claro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                                <Moon className="h-4 w-4 mr-2" /> Escuro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>
                                <Monitor className="h-4 w-4 mr-2" /> Sistema
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Backup</DropdownMenuLabel>

                            <DropdownMenuItem onClick={handleExport}>
                                <Download className="h-4 w-4 mr-2" /> Exportar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => importInputRef.current?.click()}>
                                <Upload className="h-4 w-4 mr-2" /> Importar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Sincronização</DropdownMenuLabel>

                            {!isSyncing ? (
                                <DropdownMenuItem onClick={handleStartSync}>
                                    <Share2 className="h-4 w-4 mr-2" /> Sincronizar
                                </DropdownMenuItem>
                            ) : (
                                <>
                                    <DropdownMenuItem disabled>
                                        <SyncStatusIcon status={status} />
                                        {syncLabel}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => setRoomDialogOpen(true)}>
                                        <Wifi className="h-4 w-4 mr-2" /> Ver link da sala
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={handleStopSync}

                                    >
                                        <WifiOff className="h-4 w-4 mr-2" /> Encerrar conexão
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Compartilhar sala</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Abra este link em outro dispositivo para sincronizar:
                        </p>
                        <input
                            readOnly
                            value={roomUrl}
                            className="w-full text-sm px-3 py-2 border rounded bg-muted"
                            onFocus={(e) => e.target.select()}
                        />

                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}