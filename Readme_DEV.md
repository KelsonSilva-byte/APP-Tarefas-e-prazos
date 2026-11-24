# Documentação Técnica — Tarefas e Prazos (v1.3)

Aplicativo híbrido (Web + Android via Capacitor 6) para gerenciamento de tarefas com priorização dinâmica automática, renderização segura com Markdown e notificações locais em segundo plano.

---

## Arquitetura do Projeto

O código-fonte fica isolado na pasta `www/` e dividido por responsabilidade única (9 módulos):

```text
prioridade/
├── www/
│   ├── index.html          # Estrutura da interface, formulários e modais
│   ├── style.css           # Estilização minimalista (modo escuro), trava de largura e modais
│   ├── storage.js          # Persistência nativa no Android (Capacitor Preferences)
│   ├── priority.js         # Cálculo de pontuação, formatação de tempo e limpeza de Markdown
│   ├── notifications.js    # Canais de prioridade (3 e 5) e sincronização de alarmes
│   ├── ui.js               # Renderização da lista, banner de atenção e sanitização XSS
│   ├── backup.js           # Exportação e restauração de backup JSON
│   ├── edit.js             # Modal de edição rápida de tarefas
│   └── app.js              # Controlador principal, economia de bateria e sanitização XSS
├── android/                # Projeto nativo compilado pelo Android Studio (Java 17 / AGP 8.2.2)
└── capacitor.config.json   # Configurações do pacote (ID: com.tarefas.prazos)
```

---

## Proteções de Produção Implementadas

* **Sanitização contra XSS (`app.js`):** Caracteres HTML (`<`, `>`, `&`, `"`, `'`) são escapados antes da renderização, impedindo que tags acidentais quebrem o layout ou apaguem trechos de texto.
* **Resiliência de Armazenamento (`storage.js`):** Leitura e gravação protegidas por `try/catch` para evitar travamentos caso o JSON local seja corrompido.
* **Proteção contra Limite de Alarmes (`notifications.js`):** Sincroniza no máximo as **100 tarefas futuras mais próximas** (até 300 alarmes simultâneos), respeitando o limite máximo de 500 alarmes do `AlarmManager` do Android.
* **Prevenção de Colisão de IDs (`app.js`):** Cada tarefa recebe um `notifBaseId` verificado contra duplicatas, evitando que tarefas criadas no mesmo segundo sobrescrevam os alarmes umas das outras.
* **Controle de Escala na Interface (`app.js` e `style.css`):** O banner superior exibe no máximo **3 itens críticos** em lista vertical (com contador para os demais), e palavras contínuas sem espaços sofrem quebra forçada (`overflow-wrap: anywhere`) sem gerar rolagem horizontal.
* **Economia de Bateria (`app.js`):** O ciclo de atualização de 30 segundos pausa automaticamente (`!document.hidden`) enquanto o aplicativo está minimizado.

---

## Decisão sobre a v1.4 (Busca e Filtros)
**A versão v1.4 de busca e filtros foi descartada.** O projeto permanece na versão **v1.3**, priorizando foco, leveza e ausência de complexidade desnecessária na interface principal.

---

## Guia Rápido de Manutenção (Onde alterar cada valor)

### 1. Regras de Prioridade e Texto Limpo (`www/priority.js`)
* **Limpeza de Markdown para alertas (`stripMarkdown`):** Remove `**`, `*`, `~~` e `` ` `` antes de enviar títulos para o banner superior ou para as notificações do Android.
* **Pesos de urgência por tempo restante (`calculate`):** Altere os valores de `urgencyScore` conforme as faixas de horas (`<= 0`, `<= 2`, `<= 12`, `<= 24`, `<= 72`).  
* **Fórmula da pontuação total:** `const totalScore = (importanceVal * 10) + urgencyScore;`
* **Faixas de classificação das etiquetas:** Altere os cortes `>= 85` (**Crítica**), `>= 60` (**Alta**) e `>= 35` (**Média**).

### 2. Horários e Canais de Notificação (`www/notifications.js`)
* **Comportamento dos canais (`setupChannels`):**
  * `CHANNEL_DAILY` (`importance: 3`): Notificação discreta na gaveta do sistema.
  * `CHANNEL_URGENT` (`importance: 5`): Banner flutuante no topo da tela (*Heads-up*) com vibração.
* **Limite de tarefas sincronizadas no Android (`syncUpcomingAlerts`):** `.slice(0, 100)` — define quantas tarefas futuras mantêm alarmes ativos no sistema operacional.
* **Horário do lembrete matinal no dia do evento:** Altere os números `8, 0, 0` (08:00:00).
* **Antecedência do alerta crítico:** `const oneHourBefore = dueTime - (60 * 60 * 1000);`.

### 3. Interface, Atualização e Markdown (`www/app.js`)
* **Intervalo de atualização da tela (`init`):** `30000` (30 segundos, ativo apenas com a tela visível).
* **Prazo padrão sugerido no formulário (`setDefaultDateTime`):** `now.setHours(now.getHours() + 2);`.
* **Sintaxe Markdown suportada (`formatSafeMarkdown`):** Edite as expressões regulares.
* **Limite de destaque urgente na lista:** `const isUrgent = hoursLeft <= 2;`.
* **Quantidade máxima de itens no banner vermelho:** `const MAX_VISIBLE = 3;`.

### 4. Cores e Aparência (`www/style.css`)
* **Paleta de cores global (`:root`):**
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
