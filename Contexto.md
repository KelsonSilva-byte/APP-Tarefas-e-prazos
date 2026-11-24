# Contexto de Continuidade — Aplicativo "Tarefas e Prazos" (Android APK) — v1.3

Este documento resume o estado técnico, as decisões de arquitetura, as regras de interação e o roadmap do projeto na **versão 1.3** (com a decisão explícita de **não implementar** a v1.4 de busca e filtros).

---

## 1. Protocolo de Comunicação (Obrigatório)
* **Simulação de Agentes:** Sempre conduza as análises técnicas simulando uma breve discussão entre os perfis: **Desenvolvedor de Software Sênior**, **Desenvolvedor Frontend Sênior**, **Engenheiro de QA** e **Agente de Produção / Produto**.
* **Zero perguntas de dúvida ao usuário:** Se houver ambiguidade técnica ou dúvida de produto, os agentes devem discutir e decidir a melhor abordagem entre si.
* **Entregas Cirúrgicas:** Ao apresentar código, forneça **apenas os arquivos novos** ou os **trechos exatos a serem alterados**, evitando reimprimir arquivos inteiros sem necessidade.

---

## 2. Stack Tecnológica e Ambiente de Compilação
* **Tipo de App:** Aplicativo híbrido 100% offline empacotado em APK Android.
* **Framework:** **Capacitor 6** (`@capacitor/core@6`, `@capacitor/cli@6`, `@capacitor/android@6`).
* **Plugins Nativos:** `@capacitor/local-notifications@6` e `@capacitor/preferences@6`.
* **Ambiente Android:** Windows 11, projeto nativo em **Java** (sem Kotlin), **Android Gradle Plugin (AGP) 8.2.2**, compilado no Android Studio usando **Gradle JDK `jbr-17`** (JetBrains Runtime 17).
* **Pacote / Nome:** `"Tarefas e Prazos"` | ID: `"com.tarefas.prazos"`.
* **Caminho local do projeto:** `C:\Users\kel12\Desktop\Programacao\html-js\prioridade`.
* **Fluxo de Build:** Salvar alterações em `www/` -> rodar `npx cap sync android` -> no Android Studio clicar em *Build > Build Bundle(s) / APK(s) > Build APK(s)* -> instalar por cima no celular (*Atualizar*) para preservar os dados.

---

## 3. Arquitetura Atual dos Arquivos (`www/`)
O front-end segue design minimalista escuro inspirado no Notion (`#191919` fundo, `#202020` superfícies, regra 60-30-10) e está dividido em **9 arquivos modulares**:

1. **`www/index.html`**: Estrutura da tela principal, formulário de cadastro, container da lista, *Toast* de desfazer (`#undoToast`), modal de backup (`#backupModal`) e modal de edição (`#editModal`). Ordem de carregamento dos scripts: `storage.js` -> `priority.js` -> `notifications.js` -> `ui.js` -> `backup.js` -> `edit.js` -> `app.js`.
2. **`www/style.css`**: Tema escuro, trava contra rolagem horizontal (`overflow-x: hidden`), quebra de palavras gigantes sem espaços (`overflow-wrap: anywhere`), estilos de tags (`tag-baixa`, `tag-media`, `tag-alta`, `tag-critica`), *Toast* inferior e modais.
3. **`www/storage.js`**: Persistência nativa via `Capacitor.Plugins.Preferences` na chave `'smartTasks_android_v1'`, protegida com `try/catch` contra JSON corrompido.
4. **`www/priority.js`**:
   * `stripMarkdown(text)`: Remove `**`, `*`, `~~` e `` ` `` para textos limpos em banners e notificações.      
   * `calculate(task)`: Calcula `totalScore = (importanceVal * 10) + urgencyScore`. Relevância possui **3 níveis fixos** (`1` = Baixa, `2` = Média, `3` = Alta). Urgência por horas restantes: `<= 0h` (100), `<= 2h` (80), `<= 12h` (60), `<= 24h` (40), `<= 72h` (20), `> 72h` (5). Cortes das etiquetas: `>= 85` (Crítica), `>= 60` (Alta), `>= 35` (Média), `< 35` (Baixa).
   * `formatTimeRemaining(hoursLeft)`: Formata contagem regressiva ou tempo de atraso.
5. **`www/notifications.js`**:
   * Cria 2 canais no Android: `prazos_dia_v1` (`importance: 3`, silencioso na gaveta) e `prazos_urgentes_v1` (`importance: 5`, banner flutuante *Heads-up* com vibração).
   * `syncUpcomingAlerts(tasks)`: Sincroniza no máximo as **100 tarefas futuras mais próximas** (até 300 alarmes, respeitando o limite de 500 alarmes do `AlarmManager` do Android). Agenda 3 avisos por tarefa: no dia às `08:00` (canal 3), `1 hora antes` (canal 5) e `na hora exata` (canal 5), todos com `allowWhileIdle: true`.
6. **`www/ui.js`**: Renderiza a lista ordenada, sanitiza HTML contra XSS antes de aplicar Markdown seguro (`**negrito**`, `*itálico*`, `~~riscado~~`, `` `código` ``), controla o *Toast* de desfazer e exibe o banner vermelho de atenção imediata limitado aos **top 3 itens críticos**.
7. **`www/backup.js`**: Controla o modal de exportação (copiar JSON, baixar `.json`) e restauração/importação validada com regeneração de IDs únicos de notificação.
8. **`www/edit.js`**: Abre o modal de edição ao tocar sobre o texto de qualquer tarefa, salva alterações no `StorageService`, ressincroniza alarmes e atualiza a tela.
9. **`www/app.js`**: Controlador principal. Gerencia inicialização, geração de `notifBaseId` aleatório único (sem colisões), submissão com trava anti-duplo clique (`isSubmitting`), conclusão com *Toast* de desfazer por 6 segundos (`completeTask` / `undoCompleteTask`) e economia de bateria (`setInterval` de 30s roda apenas quando `!document.hidden`).

---

## 4. Estrutura do Objeto de Tarefa (JSON)
```json
{
  "id": 1763740000000,
  "notifBaseId": 452180,
  "title": "Entregar **relatório**",
  "category": "Atividade",
  "importance": "2",
  "deadline": "2026-11-22T14:00"
}
```

---

## 5. Status do Roadmap e Decisão sobre a v1.4
* **Concluído até a v1.3:** Núcleo blindado, notificações em 2 canais (prioridade 3 e 5), Markdown seguro, banner truncado, **v1.1** (Desfazer conclusão), **v1.2** (Backup/Restauração JSON) e **v1.3** (Edição rápida de tarefas).
* **Decisão de Produto (v1.4):** **A v1.4 (Busca Instantânea e Filtros) NÃO será implementada.** O projeto permanece na v1.3 focando na simplicidade e fluidez original sem gaveta de filtros ou busca.
* **Etapas futuras a partir da v1.3:**
  * **v1.4 (Substituta):** Notas / Descrição expansível por tarefa.
  * **v1.5:** Histórico de tarefas concluídas (últimas 50).
  * **v1.6:** Botões de ação direto na notificação do Android (*Concluir* e *Adiar 15 min*).
  * **v1.7:** Subtarefas / Checklist interno.
  * **v1.8:** Tarefas recorrentes (Diária, Semanal, Mensal).
  * **v1.9:** Widget nativo na tela inicial do Android.
