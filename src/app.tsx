import { useEffect, useRef } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useRevisionStore } from "@/stores/revisions"
import { NoRevisionsFound } from "@/components/app/no-revision-found"
import { NewRevisionMenu } from "@/components/app/menus/new-revision"
import { RevisionsDisplayList } from "@/components/app/display/revisions"
import { MainHeader } from "@/components/app/headers/main-headers"
import { GeneralMetrics } from "@/components/app/display/general-metrics"

export function App() {
    const revisions = useRevisionStore((state) => state.revisions)
    const initSync = useRevisionStore((s) => s.initSync)
    const syncInitialized = useRef(false)

    useEffect(() => {
        if (syncInitialized.current) return
        syncInitialized.current = true
        initSync()
    }, [])

    return (
        <main className="flex flex-col gap-2">
            <MainHeader />
            {
                revisions.length == 0 ?
                    <section className="flex items-center justify-center py-50">
                        <NoRevisionsFound />
                    </section>
                    : <div className="flex flex-col items-start gap-5 px-5 py-10">
                        <div className="flex flex-col items-start">
                            <h2 className="text-2xl font-semibold tracking-tight">Estatísticas gerais</h2>
                            <p className="text-muted-foreground">Uma visão geral de tudo o que você já revisou.</p>
                        </div>
                        <GeneralMetrics />
                        <div className="flex flex-row items-center justify-between w-full">
                            <div className="flex flex-col items-start">
                                <h2 className="text-2xl font-semibold tracking-tight">Painel de Proficiência</h2>
                                <p className="text-muted-foreground">Analise estatística do seu desempenho.</p>
                            </div>
                            <NewRevisionMenu>
                                <Button variant="outline" size="icon">
                                    <PlusIcon />
                                </Button>
                            </NewRevisionMenu>
                        </div>
                        <RevisionsDisplayList />
                    </div>
            }
        </main>
    )
}

export default App

// if (import.meta.env.DEV && import.meta.hot) {
//     import.meta.hot.accept(() => {
//         useRevisionStore.getState().initSync()
//     })
// }