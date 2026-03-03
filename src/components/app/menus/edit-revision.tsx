import { useState } from "react"
import { Button } from "@/components/ui/button"

import {
    Dialog,
    DialogTitle,
    DialogHeader,
    DialogFooter,
    DialogContent,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ButtonGroup } from "@/components/ui/button-group"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useRevisionStore } from "@/stores/revisions"

import { AlertCircle, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { Field, FieldLabel } from "@/components/ui/field"

import type { Revision } from "@/lib/revisions"

interface AccuracyPreviewProps {
    accuracy: number | null
    hasError: boolean
}

function AccuracyPreview({ accuracy, hasError }: AccuracyPreviewProps) {
    if (hasError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Os acertos não podem ser maiores que o total de questões.
                </AlertDescription>
            </Alert>
        )
    }

    const label = accuracy === null
        ? "Preencha o total e os acertos para ver seu aproveitamento."
        : accuracy >= 80 ? "Ótimo desempenho! Continue assim."
            : accuracy >= 60 ? "Desempenho razoável. Há espaço para melhorar."
                : accuracy >= 40 ? "Desempenho abaixo do esperado. Vale revisar o conteúdo."
                    : "Desempenho crítico. Recomenda-se revisão completa do tópico."

    return (
        <Alert>
            <AlertDescription className="space-y-2">
                <div className="flex w-full items-center justify-between">
                    <span className="font-medium text-foreground">Aproveitamento</span>
                    {accuracy !== null && (
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                            {accuracy}%
                        </span>
                    )}
                </div>
                <Progress value={accuracy ?? 0} className="h-1.5" />
                <p className="text-xs">{label}</p>
            </AlertDescription>
        </Alert>
    )
}

type FormData = {
    subject: string
    group: string
    total: number
    hits: number
}

const STEPS = ["Matéria", "Desempenho"] as const

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

interface EditRevisionMenuProps {
    index: number
    revision: Revision
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function EditRevisionMenu({ index, revision, children, open: controlledOpen, onOpenChange: controlledOnOpenChange }: EditRevisionMenuProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [step, setStep] = useState(0)
    const [form, setForm] = useState<FormData>({
        subject: revision.subject,
        group: revision.group || "",
        total: revision.total,
        hits: revision.hits,
    })

    const isControlled = controlledOpen !== undefined
    const isOpen = isControlled ? controlledOpen : internalOpen
    const setIsOpen = isControlled ? (controlledOnOpenChange ?? (() => { })) : setInternalOpen

    const updateRevision = useRevisionStore((state) => state.updateRevision)

    const resetAndClose = () => {
        setForm({ subject: revision.subject, group: revision.group || "", total: revision.total, hits: revision.hits })
        setStep(0)
        setIsOpen(false)
    }

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setForm({ subject: revision.subject, group: revision.group || "", total: revision.total, hits: revision.hits })
            setStep(0)
            setIsOpen(true)
        } else {
            resetAndClose()
        }
    }

    const handleFinish = () => {
        updateRevision(index, form)
        resetAndClose()
    }

    const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }))

    const increment = (field: "total" | "hits") =>
        setForm((prev) => ({
            ...prev,
            [field]: field === "hits"
                ? clamp(prev.hits + 1, 0, prev.total)
                : prev.total + 1,
        }))

    const decrement = (field: "total" | "hits") =>
        setForm((prev) => ({
            ...prev,
            [field]: clamp(prev[field] - 1, 0, Infinity),
        }))

    const hitsExceedTotal = form.hits > form.total
    const accuracy = form.total > 0 && !hitsExceedTotal
        ? Math.round((form.hits / form.total) * 100)
        : null

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {!isControlled && (
                <DialogTrigger asChild>{children}</DialogTrigger>
            )}
            <DialogContent className="max-w-sm sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar revisão</DialogTitle>
                    <DialogDescription>
                        {step === 0
                            ? "Altere a matéria ou tópico."
                            : `Editando desempenho em "${form.subject}"`}
                    </DialogDescription>
                </DialogHeader>

                <Progress value={((step + 1) / STEPS.length) * 100} className="h-1" />

                <div className="space-y-4">
                    {step === 0 && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Editar assunto</Label>
                                <Input
                                    id="subject"
                                    placeholder="Ex: Direito Administrativo"
                                    value={form.subject}
                                    autoFocus
                                    onChange={(e) => setField("subject", e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && form.subject.trim() && setStep(1)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="group">Editar grupo</Label>
                                <Input
                                    id="group"
                                    placeholder="Ex: Faculdade"
                                    value={form.group}
                                    onChange={(e) => setField("group", e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <>
                            <div className="flex flex-col gap-3">
                                <Field>
                                    <FieldLabel htmlFor="total">Total de questões</FieldLabel>
                                    <ButtonGroup>
                                        <Input
                                            id="total"
                                            type="number"
                                            min={0}
                                            autoFocus
                                            placeholder="0"
                                            value={form.total || ""}
                                            onChange={(e) => setField("total", Math.max(0, Number(e.target.value)))}
                                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <Button size="icon" variant="outline" onClick={() => increment("total")}>
                                            <ArrowUpIcon />
                                        </Button>
                                        <Button size="icon" variant="outline" onClick={() => decrement("total")}>
                                            <ArrowDownIcon />
                                        </Button>
                                    </ButtonGroup>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="hits">Total de acertos</FieldLabel>
                                    <ButtonGroup>
                                        <Input
                                            id="hits"
                                            type="number"
                                            min={0}
                                            placeholder="0"
                                            value={form.hits || ""}
                                            onChange={(e) => setField("hits", clamp(Number(e.target.value), 0, form.total))}
                                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <Button size="icon" variant="outline" onClick={() => increment("hits")}>
                                            <ArrowUpIcon />
                                        </Button>
                                        <Button size="icon" variant="outline" onClick={() => decrement("hits")}>
                                            <ArrowDownIcon />
                                        </Button>
                                    </ButtonGroup>
                                </Field>
                            </div>

                            <AccuracyPreview accuracy={accuracy} hasError={hitsExceedTotal} />
                        </>
                    )}
                </div>

                <DialogFooter className="items-end">
                    <div className="flex flex-row gap-2">
                        {step > 0 && (
                            <Button variant="outline" onClick={() => setStep(step - 1)}>
                                Voltar
                            </Button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <Button disabled={!form.subject.trim()} onClick={() => setStep(step + 1)}>
                                Próximo
                            </Button>
                        ) : (
                            <Button onClick={handleFinish} disabled={form.total <= 0 || hitsExceedTotal}>
                                Salvar Alterações
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}