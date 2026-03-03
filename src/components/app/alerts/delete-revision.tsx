import {
    AlertDialog,
    AlertDialogTitle,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogTrigger,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog"

import { useRevisionStore } from "@/stores/revisions"

interface DeleteRevisionAlertProps {
    index: number
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function DeleteRevisionAlert({ index, children, open, onOpenChange }: DeleteRevisionAlertProps) {
    const deleteRevision = useRevisionStore((state) => state.deleteRevision)
    const isControlled = open !== undefined

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {!isControlled && (
                <AlertDialogTrigger asChild>
                    {children}
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente sua revisão desta sessão.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteRevision(index)}>
                        Continuar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}