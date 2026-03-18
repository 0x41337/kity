import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "@/app"

import { Toaster } from "@/components/ui/sonner"

import { ThemeProvider } from "@/providers/theme-provider"
import { initSyncFromUrl } from "@/stores/sync-store"

initSyncFromUrl()

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <App />
            <Toaster />
        </ThemeProvider>
    </StrictMode>
)
