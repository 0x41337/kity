import { toast } from "sonner"

import { useRef } from "react"

import {
    DropdownMenu,
    DropdownMenuSub,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"

import { useTheme } from "@/providers/theme-provider"
import { useRevisionStore } from "@/stores/revisions"

import { Settings, Sun, Moon, Monitor, Download, Upload } from "lucide-react"

export function MainHeader() {
    const { theme, setTheme } = useTheme()
    const importInputRef = useRef<HTMLInputElement>(null)

    const revisions = useRevisionStore((state) => state.revisions)
    const importData = useRevisionStore((state) => state.importData)

    const handleExport = () => {
        const blob = new Blob([JSON.stringify({ total: revisions }, null, 2)], {
            type: "application/json",
        })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = `kity-backup-${new Date().toISOString().slice(0, 10)}.json`
        anchor.click()
        URL.revokeObjectURL(url)
        toast.success("Revisões exportadas com sucesso!")

    }

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string)
                importData(parsed)
                toast.success("Revisões importadas com sucesso!")
            } catch {
                toast.error("Arquivo de backup inválido.")
            }
        }
        reader.readAsText(file)

        // Reset so the same file can be re-imported if needed
        e.target.value = ""
    }

    return (
        <header className="flex flex-row items-center justify-between w-full border-b py-5">
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
                        <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                {theme === "dark" ? (
                                    <Moon className="h-4 w-4 mr-2" />
                                ) : theme === "light" ? (
                                    <Sun className="h-4 w-4 mr-2" />
                                ) : (
                                    <Monitor className="h-4 w-4 mr-2" />
                                )}
                                Tema
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => setTheme("light")}>
                                    <Sun className="h-4 w-4 mr-2" />
                                    Claro
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")}>
                                    <Moon className="h-4 w-4 mr-2" />
                                    Escuro
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")}>
                                    <Monitor className="h-4 w-4 mr-2" />
                                    Sistema
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Backup</DropdownMenuLabel>

                        <DropdownMenuItem onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar revisões
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => importInputRef.current?.click()}>
                            <Upload className="h-4 w-4 mr-2" />
                            Importar revisões
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}