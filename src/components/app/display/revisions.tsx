import {
    Card,
    CardTitle,
    CardHeader,
    CardContent,
    CardDescription,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

import { useRevisionStore } from "@/stores/revisions"
import { calculateMetrics } from "@/lib/statistics"

import { EditRevisionMenu } from "@/components/app/menus/edit-revision"
import { DeleteRevisionAlert } from "@/components/app/alerts/delete-revision"

import { Pencil, Trash2 } from "lucide-react"

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
        if (a === DEFAULT_GROUP) return -1;
        if (b === DEFAULT_GROUP) return 1;
        return a.localeCompare(b);
    })

    return (
        <div className="w-full flex flex-col gap-8">
            {entries.map(([group, items]) => (
                <div key={group} className="flex flex-col gap-3">
                    <p className="max-w-lg text-sm font-bold text-muted-foreground uppercase tracking-wide wrap-break-word">
                        {group}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                        {items.map(({ revision, index }) => {
                            const { accuracyRate, knowledgeRate, marginOfError } = calculateMetrics(revision.hits, revision.total)

                            return (
                                <Card key={index} className="flex flex-col h-full">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <CardTitle className="line-clamp-2">{revision.subject}</CardTitle>
                                                <CardDescription>
                                                    {revision.hits} / {revision.total} acertos
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <EditRevisionMenu index={index} revision={revision}>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                </EditRevisionMenu>
                                                <DeleteRevisionAlert index={index}>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DeleteRevisionAlert>
                                            </div>
                                        </div>
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
                                                <p className="text-muted-foreground">Margem de erro</p>
                                                <p className="font-medium text-foreground tabular-nums">±{marginOfError}%</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}