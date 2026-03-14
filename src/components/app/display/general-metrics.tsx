import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRevisionStore } from "@/stores/revisions"

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value)
}

export function GeneralMetrics() {
    const {
        accuracyRate,
        knowledgeRate,
        totalQuestions,
        totalQuestionsReviewed,
    } = useRevisionStore(
        (state) => state.metrics
    )

    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>
                        Índice Geral de Aproveitamento
                    </CardTitle>
                    <CardDescription>
                        Percentual de acertos considerando todas as questões já resolvidas.
                    </CardDescription>
                </CardHeader>

                <CardContent className="mt-auto">
                    <p className="text-3xl font-bold tabular-nums">
                        {accuracyRate}%
                    </p>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>
                        Índice Geral de Proficiência
                    </CardTitle>
                    <CardDescription>
                        Estimativa do seu nível de domínio com base no desempenho e na recorrência dos acertos.
                    </CardDescription>
                </CardHeader>

                <CardContent className="mt-auto">
                    <p className="text-3xl font-bold tabular-nums">
                        {knowledgeRate}%
                    </p>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>
                        Total de Questões Revisadas
                    </CardTitle>
                    <CardDescription>
                        Quantidade total de questões revisadas e respondidas até o momento.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-row mt-auto">
                    <p className="text-3xl font-bold tabular-nums">
                        {totalQuestionsReviewed}
                    </p>
                    <p className="text-3xl font-bold tabular-nums truncate text-muted-foreground">/{formatCompactNumber(totalQuestions)}</p>
                </CardContent>
            </Card>
        </div>
    )
}