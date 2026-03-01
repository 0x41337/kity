# 🐱 Kity

**Kity** é um dashboard personalizado para estudantes que utilizam o **Estudo Reverso** (estudo baseado em questões). Diferente de ferramentas comuns que mostram apenas a porcentagem bruta de acertos, o Kity utiliza modelos estatísticos avançados para medir a real solidez do seu conhecimento.

## 🚀 Por que o Kity? (O problema da Planilha Simples)

Se você faz 2 questões e acerta as 2, uma planilha dirá que seu aproveitamento é **100%**. Mas estatisticamente, 2 questões não provam nada. No dia da prova, você pode errar a terceira.

O Kity resolve o "falso positivo" do estudo:

* **Planilhas comuns:** Tratam 2/2 (100%) da mesma forma que 100/100 (100%).
* **Kity:** Entende que 100/100 é muito mais confiável que 2/2. Ele penaliza a amostragem pequena para que você não tenha uma falsa sensação de segurança.

## 📊 O Módulo de Estatística: Modelagem de Conhecimento

O coração do Kity é baseado em inferência Bayesiana e na **Distribuição Beta**. Em vez de olhar apenas para o passado (quantas você acertou), o Kity tenta prever o futuro (qual sua chance real de acertar a próxima questão).

### Como funciona o cálculo:

1. **Intervalo de Confiança de Clopper-Pearson:** Utilizamos o método exato para calcular o limite inferior de um intervalo de confiança de 99%.
2. **Aproximação de Lanczos:** Para lidar com cálculos complexos de probabilidade (Função Gamma) de forma performática no navegador.
3. **Knowledge Rate (Taxa de Conhecimento Real):** Não mostramos apenas o `accuracyRate`. Exibimos uma estimativa conservadora. Se você acertou 9 de 10 questões, sua precisão é 90%, mas sua *Taxa de Conhecimento Real* será menor, refletindo a incerteza de ter feito apenas 10 questões.

### Métricas Geradas:

| Métrica | Descrição |
| --- | --- |
| **Aproveitamento (Accuracy)** | A porcentagem bruta de acertos (Hits/Total). |
| **Nível de Conhecimento** | Uma estimativa conservadora (99% de confiança). É o quanto você realmente domina o assunto "na pior das hipóteses". |
| **Margem de Erro** | A distância entre seu aproveitamento e seu nível real. Quanto maior a margem, mais questões você precisa fazer para validar sua nota. |

$$KnowledgeRate = I^{-1}_{0.01}(hits + 1, total - hits + 1)$$

## 🛠️ Tecnologias

* **React + Vite**
* **Tailwind CSS + Shadcn/UI**
* **Zustand** (Gerenciamento de estado)
* **Lucide React** (Ícones)
* **Matemática Pura:** Implementação manual de funções Gamma e Beta Incompleta para precisão estatística.

