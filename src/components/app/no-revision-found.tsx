import { toast } from "sonner"

import { useRef } from "react"
import { Button } from "@/components/ui/button"

import {
    Empty,
    EmptyTitle,
    EmptyMedia,
    EmptyHeader,
    EmptyContent,
    EmptyDescription,
} from "@/components/ui/empty"

import { PlusIcon, UploadIcon, FileWarningIcon } from "lucide-react"

import { useRevisionStore } from "@/stores/revisions"
import { NewRevisionMenu } from "@/components/app/menus/new-revision"

export function NoRevisionsFound() {
    const importData = useRevisionStore((state) => state.importData)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string)
                importData(json)
                toast.success("Revisões importadas com sucesso!")
            } catch (error) {
                toast.error("Erro ao ler o arquivo JSON. Verifique o formato.")
            }
        }
        reader.readAsText(file)
    }

    return <div className="container">
        <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileChange}
        />
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <FileWarningIcon />
                </EmptyMedia>
                <EmptyTitle>Ainda não há revisões.</EmptyTitle>
                <EmptyDescription>
                    Você ainda não registrou nenhuma revisão. Comece registrando uma revisão.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
                <NewRevisionMenu>
                    <Button>
                        <PlusIcon />
                        Nova revisão</Button>

                </NewRevisionMenu>
                <Button variant="outline" onClick={handleImportClick}>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Importar revisões (.json)
                </Button>
            </EmptyContent>
        </Empty>
    </div>
}
