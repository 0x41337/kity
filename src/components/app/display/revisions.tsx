import {
    Card,
    CardTitle,
    CardHeader,
    CardContent,
    CardFooter,
    CardDescription,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useRevisionStore } from "@/stores/revisions"
import { calculateMetrics } from "@/lib/statistics"

import { EditRevisionMenu } from "@/components/app/menus/edit-revision"
import { QuickRevisionMenu } from "@/components/app/menus/quick-revision"
import { DeleteRevisionAlert } from "@/components/app/alerts/delete-revision"

import { ZapIcon, PencilIcon, Trash2Icon, MoreHorizontalIcon } from "lucide-react"
import { useState } from "react"

const DEFAULT_GROUP = "Não categorizados".toUpperCase()

export function RevisionsDisplayList() {
    const revisions = useRevisionStore((state) => state.revisions)

    const grouped = revisions.reduce<Record<string, { revision: typeof revisions[0]; index: number }[]>>(
        (acc, revision, index) => {
            const key = revision.group?.trim().toUpperCase() || DEFAULT_GROUP
            if (!acc[key]) acc[key] = []
            acc[key].push({ revision, index })
            return acc
        },
        {}
    )

    const entries = Object.entries(grouped).sort(([a], [b]) => {
        if (a === DEFAULT_GROUP) return -1
        if (b === DEFAULT_GROUP) return 1
        return a.localeCompare(b)
    })

    return (
        <div className="w-full flex flex-col gap-8">
            {entries.map(([group, items]) => (
                <div key={group} className="flex flex-col gap-3">
                    <p className="max-w-lg text-sm font-bold text-muted-foreground uppercase tracking-wide wrap-break-word">
                        {group}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                        {items.map(({ revision, index }) => (
                            <RevisionCard key={index} revision={revision} index={index} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

function RevisionCard({ revision, index }: { revision: ReturnType<typeof useRevisionStore.getState>["revisions"][0]; index: number }) {
    const { accuracyRate, knowledgeRate, marginOfError } = calculateMetrics(revision.hits, revision.total)

    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="line-clamp-2">{revision.subject}</CardTitle>
                <CardDescription>{revision.hits} / {revision.total} acertos</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Aproveitamento</span>
                        <span className="tabular-nums font-medium text-foreground">{accuracyRate}%</span>
                    </div>
                    <Progress value={accuracyRate} className="h-1.5" />
                </div>

                <Separator />

                <div className="flex flex-row items-center justify-between text-xs">
                    <div>
                        <p className="text-muted-foreground">Nível de conhecimento</p>
                        <p className="font-medium text-foreground tabular-nums">{knowledgeRate}%</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Índice de Incerteza</p>
                        <p className="font-medium text-foreground tabular-nums">±{marginOfError}%</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0 gap-1 px-1">
                <QuickRevisionMenu index={index} revision={revision}>
                    <Button variant="secondary" className="flex-1">
                        <ZapIcon className="h-3.5 w-3.5" />
                        Revisão rápida
                    </Button>
                </QuickRevisionMenu>

                <EditRevisionMenu index={index} revision={revision} open={editOpen} onOpenChange={setEditOpen}>
                    <span />
                </EditRevisionMenu>

                <DeleteRevisionAlert index={index} open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <span />
                </DeleteRevisionAlert>

                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon">
                            <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => { setDropdownOpen(false); setEditOpen(true) }}>
                            <PencilIcon className="h-3.5 w-3.5" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => { setDropdownOpen(false); setDeleteOpen(true) }}
                        >
                            <Trash2Icon className="h-3.5 w-3.5" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    )
}