import { toast } from "sonner"
import { useRef } from "react"

import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"

import { useTheme } from "@/providers/theme-provider"
import { useRevisionStore } from "@/stores/revisions"

import { SyncMenu } from "@/components/app/menus/sync-menu"

import {
    Sun,
    Moon,
    Upload,
    Monitor,
    Settings,
    Download,
    ArrowLeftRight,
} from "lucide-react"

export function MainHeader() {
    const { setTheme } = useTheme()
    const importInputRef = useRef<HTMLInputElement>(null)

    const revisions = useRevisionStore((s) => s.revisions)
    const importData = useRevisionStore((s) => s.importData)

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

    return (
        <>
            <header className="flex items-center justify-between w-full border-b py-5">
                <div className="px-5">
                    <a href="/">
                        <h1 className="text-xl font-extrabold tracking-tight">Kity</h1>
                    </a>
                </div>

                <div className="flex items-center gap-1 px-5">
                    <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={handleImport}
                    />

                    <SyncMenu>
                        <Button variant="ghost" size="icon" title="Sincronizar dispositivos">
                            <ArrowLeftRight className="h-4 w-4" />
                        </Button>
                    </SyncMenu>

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
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        </>
    )
}