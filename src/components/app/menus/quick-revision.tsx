import { useState, useEffect, useRef } from "react"
import { XIcon, CheckIcon, UndoIcon, RedoIcon } from "lucide-react"

import { Kbd } from "@/components/ui/kbd"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import {
    Dialog,
    DialogTitle,
    DialogHeader,
    DialogContent,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"

import { useRevisionStore } from "@/stores/revisions"
import type { Revision } from "@/lib/revisions"

interface QuickRevisionMenuProps {
    index: number
    revision: Revision
    children: React.ReactNode
}

type Snapshot = Pick<Revision, "hits" | "total">

export function QuickRevisionMenu({ index, revision, children }: QuickRevisionMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [current, setCurrent] = useState<Snapshot>({ hits: revision.hits, total: revision.total })
    const [past, setPast] = useState<Snapshot[]>([])
    const [future, setFuture] = useState<Snapshot[]>([])

    const updateRevision = useRevisionStore((state) => state.updateRevision)
    const getRevision = useRevisionStore((state) => state.revisions)

    const accuracy = current.total > 0 ? Math.round((current.hits / current.total) * 100) : 0
    const canUndo = past.length > 0
    const canRedo = future.length > 0

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setCurrent({ hits: revision.hits, total: revision.total })
            setPast([])
            setFuture([])
        }
        setIsOpen(open)
    }

    const commit = (next: Snapshot) => {
        setPast((prev) => [...prev, current])
        setFuture([])
        setCurrent(next)
        // Busca a revisão mais atual do store para não perder campos
        const fresh = getRevision[index]
        updateRevision(index, { ...fresh, ...next })
    }

    const handleHit = () => commit({ hits: current.hits + 1, total: current.total + 1 })
    const handleMiss = () => commit({ hits: current.hits, total: current.total + 1 })

    const handleUndo = () => {
        if (!canUndo) return
        const previous = past[past.length - 1]
        setPast((prev) => prev.slice(0, -1))
        setFuture((prev) => [current, ...prev])
        setCurrent(previous)
        const fresh = getRevision[index]
        updateRevision(index, { ...fresh, ...previous })
    }

    const handleRedo = () => {
        if (!canRedo) return
        const next = future[0]
        setFuture((prev) => prev.slice(1))
        setPast((prev) => [...prev, current])
        setCurrent(next)
        const fresh = getRevision[index]
        updateRevision(index, { ...fresh, ...next })
    }

    const handleUndoRef = useRef(handleUndo)
    const handleRedoRef = useRef(handleRedo)
    const canUndoRef = useRef(canUndo)
    const canRedoRef = useRef(canRedo)

    useEffect(() => {
        handleUndoRef.current = handleUndo
        handleRedoRef.current = handleRedo
        canUndoRef.current = canUndo
        canRedoRef.current = canRedo
    })

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            const isModifier = e.ctrlKey || e.metaKey
            const isUndo = key === "z" && isModifier && !e.shiftKey
            const isRedo = key === "z" && isModifier && e.shiftKey

            if (isUndo) {
                e.preventDefault()
                if (canUndoRef.current) handleUndoRef.current()
            } else if (isRedo) {
                e.preventDefault()
                if (canRedoRef.current) handleRedoRef.current()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen])

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="line-clamp-1">{revision.subject}</DialogTitle>
                    <DialogDescription>
                        Registre acertos e erros em tempo real.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div className="text-center">
                            <p className="text-2xl font-bold tabular-nums text-foreground">{current.hits}</p>
                            <p className="text-xs text-muted-foreground">acertos</p>
                        </div>
                        <div className="text-2xl font-light text-muted-foreground">/</div>
                        <div className="text-center">
                            <p className="text-2xl font-bold tabular-nums text-foreground">{current.total}</p>
                            <p className="text-xs text-muted-foreground">total</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="text-center">
                            <p className="text-2xl font-bold tabular-nums">{accuracy}%</p>
                            <p className="text-xs text-muted-foreground">aproveitamento</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-16 flex-col"
                            onClick={handleMiss}
                        >
                            <XIcon className="h-5 w-5" />
                            <span className="text-xs font-medium">Errei</span>
                        </Button>
                        <Button
                            size="lg"
                            className="h-16 flex-col gap-1"
                            onClick={handleHit}
                        >
                            <CheckIcon className="h-5 w-5" />
                            <span className="text-xs font-medium">Acertei</span>
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            size="lg"
                            variant="ghost"
                            className="w-full text-muted-foreground select-none"
                            disabled={!canUndo}
                            onClick={handleUndo}
                        >
                            <UndoIcon className="h-3.5 w-3.5" />
                            Desfazer
                            {canUndo && (
                                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                                    {past.length}
                                </span>
                            )}
                        </Button>
                        <Button
                            size="lg"
                            variant="ghost"
                            className="w-full text-muted-foreground select-none"
                            disabled={!canRedo}
                            onClick={handleRedo}
                        >
                            <RedoIcon className="h-3.5 w-3.5" />
                            Refazer
                            {canRedo && (
                                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                                    {future.length}
                                </span>
                            )}
                        </Button>
                    </div>

                    <Separator />

                    <p className="text-xs text-muted-foreground text-center">
                        Use <Kbd>Ctrl + Z</Kbd> para desfazer e <Kbd>Ctrl + Shift + Z</Kbd> para refazer.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}