import { useState } from "react"
import { toast } from "sonner"
import { Copy, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog"

import { useRevisionStore } from "@/stores/revisions"

type Mode = "idle" | "share" | "receive"

export function SyncMenu({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<Mode>("idle")
    const [code, setCode] = useState("")
    const [inputCode, setInputCode] = useState("")
    const [loading, setLoading] = useState(false)

    const syncPublish = useRevisionStore((s) => s.syncPublish)
    const syncConsume = useRevisionStore((s) => s.syncConsume)

    async function handleShare() {
        setLoading(true)
        try {
            const generated = await syncPublish()
            setCode(generated)
            setMode("share")
        } catch {
            toast.error("Erro ao gerar código de sincronização.")
        } finally {
            setLoading(false)
        }
    }

    async function handleReceive() {
        if (inputCode.length !== 6) return
        setLoading(true)
        try {
            await syncConsume(inputCode)
            toast.success("Sincronização concluída!")
            handleClose(false)
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Erro ao sincronizar.")
        } finally {
            setLoading(false)
        }
    }

    function handleClose(v: boolean) {
        setOpen(v)
        if (!v) {
            setMode("idle")
            setCode("")
            setInputCode("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Sincronizar dispositivos</DialogTitle>
                    <DialogDescription>
                        {mode === "idle" && "Transfira suas revisões para outro dispositivo sem perder dados."}
                        {mode === "share" && "Compartilhe o código com o outro dispositivo."}
                        {mode === "receive" && "Digite o código gerado no outro dispositivo."}
                    </DialogDescription>
                </DialogHeader>

                {mode === "idle" && (
                    <div className="flex flex-col gap-3 pt-2">
                        <Button onClick={handleShare} disabled={loading}>
                            {loading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                            Gerar código para compartilhar
                        </Button>
                        <Button variant="outline" onClick={() => setMode("receive")}>
                            Tenho um código
                        </Button>
                    </div>
                )}

                {mode === "share" && (
                    <div className="flex flex-col gap-4 pt-2 items-center">
                        <p className="text-sm text-muted-foreground text-center">
                            Digite esse código no outro dispositivo.
                            Ele expira após um uso ou em 10 minutos.
                        </p>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-mono font-bold tracking-[0.3em]">
                                {code}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    navigator.clipboard.writeText(code)
                                    toast.success("Código copiado!")
                                }}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Seus dados permanecem salvos localmente neste dispositivo.
                        </p>
                    </div>
                )}

                {mode === "receive" && (
                    <div className="flex flex-col gap-3 pt-2">
                        <Input
                            placeholder="000000"
                            maxLength={6}
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ""))}
                            className="text-center text-2xl font-mono tracking-[0.3em]"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleReceive()}
                        />
                        <Button
                            onClick={handleReceive}
                            disabled={inputCode.length !== 6 || loading}
                        >
                            {loading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                            Sincronizar
                        </Button>
                        <Button variant="ghost" onClick={() => setMode("idle")}>
                            Voltar
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}