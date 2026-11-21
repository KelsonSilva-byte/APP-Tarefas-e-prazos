# Documentação Técnica — Tarefas e Prazos

Aplicativo híbrido (Web + Android via Capacitor 6) para gerenciamento de tarefas com priorização dinâmica automática, renderização segura com Markdown e notificações locais em segundo plano.

---

## Arquitetura do Projeto

O código-fonte fica isolado na pasta `www/` e dividido por responsabilidade única:

```text
prioridade/
├── www/
│   ├── index.html          # Estrutura da interface, formulários e gaveta retrátil de filtros (v1.4)
│   ├── style.css           # Estilização minimalista (modo escuro), trava de largura e estilos da gaveta de filtros
│   ├── storage.js          # Persistência nativa no Android (Capacitor Preferences)
│   ├── priority.js         # Cálculo de pontuação, formatação de tempo e limpeza de Markdown
│   ├── notifications.js    # Canais de prioridade (3 e 5) e sincronização de alarmes
│   ├── ui.js               # Renderização da lista, banner de atenção independente de filtros e sanitização XSS
│   ├── filters.js          # Lógica de busca e filtros (v1.4): busca por título/categoria, categoria, urgência e prazo
│   ├── backup.js           # Exportação e restauração de backup JSON
│   ├── edit.js             # Modal de edição rápida de tarefas
│   └── app.js              # Controlador principal, estado de filtros ativos, economia de bateria e sanitização XSS
├── android/                # Projeto nativo compilado pelo Android Studio (Java 17 / AGP 8.2.2)
└── capacitor.config.json     # Configurações do pacote (ID: com.tarefas.prazos)
```

---

## Proteções de Produção Implementadas

* **Sanitização contra XSS (`app.js`):** Caracteres HTML (`<`, `>`, `&`, `"`, `'`) são escapados antes da renderização, impedindo que tags acidentais quebrem o layout ou apaguem trechos de texto.
* **Resiliência de Armazenamento (`storage.js`):** Leitura e gravação protegidas por `try/catch` para evitar travamentos caso o JSON local seja corrompido.
* **Proteção contra Limite de Alarmes (`notifications.js`):** Sincroniza no máximo as **100 tarefas futuras mais próximas** (até 300 alarmes simultâneos), respeitando o limite máximo de 500 alarmes do `AlarmManager` do Android.
* **Prevenção de Colisão de IDs (`app.js`):** Cada tarefa recebe um `notifBaseId` aleatório verificado contra duplicatas, evitando que tarefas criadas no mesmo segundo sobrescrevam os alarmes umas das outras.
* **Controle de Escala na Interface (`app.js` e `style.css`):** O banner superior exibe no máximo **3 itens críticos** em lista vertical (com contador para os demais), e palavras contínuas sem espaços sofrem quebra forçada (`overflow-wrap: anywhere`) sem gerar rolagem horizontal.
* **Economia de Bateria (`app.js`):** O ciclo de atualização de 30 segundos pausa automaticamente (`!document.hidden`) enquanto o aplicativo está minimizado.

---

## Busca e Filtros (v1.4)

A lista de tarefas suporta busca instantânea e filtros combinados através de uma **gaveta retrátil** (estilo Notion) acessada pelo botão discreto "Filtrar" no cabeçalho da lista.

### Arquivos envolvidos
* **`www/filters.js`**: `FilterService.filter(tasks, { searchQuery, categoryFilter, urgencyFilter, deadlineFilter })` — retorna o subconjunto filtrado sem modificar os dados originais.
* **`www/ui.js`**: `renderTasks(tasks, filters)` — aplica os filtros antes de ordenar por `totalScore`. O banner de atenção imediata é sempre calculado sobre **todas as tarefas** (independente de filtros) para nunca esconder prazos críticos.
* **`www/app.js`**: `currentFilters` armazena `{ searchQuery, categoryFilter, urgencyFilter, deadlineFilter }`. `bindFilterEvents()` gerencia toggle da gaveta, busca via `input` (instantânea) e selects via `change`.

### Regras de filtro
| Filtro | Comportamento |
|--------|--------------|
| Busca | Texto parcial, case-insensitive, busca em título e categoria |
| Categoria | Exato: `Atividade`, `Compromisso` ou `Prazo` |
| Urgência | Nível calculado por `PriorityEngine.calculate()`: `Baixa`, `Média`, `Alta` ou `Crítica` |
| Prazo | Relativo a agora: `Hoje`, `Esta semana` ou `Este mês` |

### Indicador visual
Quando um ou mais filtros estão ativos, o botão "Filtrar" exibe um badge discreto com a contagem de filtros aplicados (ex: `Filtrar 2`). Clicar fora da gaveta fecha-a automaticamente, mas mantém os filtros ativos.

## Guia Rápido de Manutenção (Onde alterar cada valor)

### 1. Regras de Prioridade e Texto Limpo (`www/priority.js`)
* **Limpeza de Markdown para alertas (`stripMarkdown`, linhas 2–9):**
  Remove `**`, `*`, `~~` e `` ` `` antes de enviar títulos para o banner superior ou para as notificações do Android.
* **Pesos de urgência por tempo restante (`calculate`, linhas 26–38):**
  Altere os valores de `urgencyScore` conforme as faixas de horas (`<= 0`, `<= 2`, `<= 12`, `<= 24`, `<= 72`).
* **Fórmula da pontuação total (linha 41):**
  `const totalScore = (importanceVal * 10) + urgencyScore;`
* **Faixas de classificação das etiquetas (linhas 44–50):**
  Altere os cortes `>= 85` (**Crítica**), `>= 60` (**Alta**) e `>= 35` (**Média**).

### 2. Horários e Canais de Notificação (`www/notifications.js`)
* **Comportamento dos canais (`setupChannels`, linhas 8–26):**
  * `CHANNEL_DAILY` (`importance: 3`): Notificação discreta na gaveta do sistema.
  * `CHANNEL_URGENT` (`importance: 5`): Banner flutuante no topo da tela (*Heads-up*) com vibração.
* **Limite de tarefas sincronizadas no Android (`syncUpcomingAlerts`, linha 54):**
  `.slice(0, 100)` — define quantas tarefas futuras mantêm alarmes ativos no sistema operacional.
* **Horário do lembrete matinal no dia do evento (linhas 63–69):**
  Altere os números `8, 0, 0` (08:00:00) dentro de `new Date(..., 8, 0, 0)`.
* **Antecedência do alerta crítico (linha 82):**
  `const oneHourBefore = dueTime - (60 * 60 * 1000);` — altere o primeiro `60` para mudar os minutos de antecedência.

### 3. Interface, Atualização e Markdown (`www/app.js`)
* **Intervalo de atualização da tela (`init`, linhas 14–16):**
  `30000` (30 segundos, ativo apenas com a tela visível).
* **Prazo padrão sugerido no formulário (`setDefaultDateTime`, linha 48):**
  `now.setHours(now.getHours() + 2);`
* **Sintaxe Markdown suportada (`formatSafeMarkdown`, linhas 108–120):**
  Edite as expressões regulares para adicionar ou remover formatações na lista principal.
* **Limite de destaque urgente na lista (`render`, linha 145):**
  `const isUrgent = hoursLeft <= 2;`
* **Quantidade máxima de itens no banner vermelho (`render`, linha 216):**
  `const MAX_VISIBLE = 3;`

### 4. Cores e Aparência (`www/style.css`)
* **Paleta de cores global (`:root`, linhas 1–16):**
  * `--bg-primary`: Fundo principal (`#191919`).
  * `--bg-subtle`: Fundo da área de cadastro (`#202020`).
  * `--accent-critical`: Destaque crítico (`#ff6b6b`).
  * `--accent-high`: Destaque de alta prioridade (`#ffa94d`).

---

## Como Gerar o APK Após Alterações

1. Salve os arquivos modificados dentro de `www/`.
2. No PowerShell (na raiz do projeto), execute:
   ```powershell
   npx cap sync android
   ```
3. No **Android Studio** (configurado com **Gradle JDK `jbr-17`**), clique em **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. O instalador será gerado em `android\app\build\outputs\apk\debug\app-debug.apk`.
