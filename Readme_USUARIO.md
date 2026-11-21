# Manual de Uso — Tarefas e Prazos

Aplicativo minimalista para organização de compromissos, atividades e entregas com reordenação automática por urgência, formatação de texto e alertas em segundo plano.

---

## Como Adicionar uma Tarefa

1. **Título:** Digite o nome da atividade ou compromisso no campo principal.
2. **Tipo:** Escolha entre *Atividade*, *Compromisso* ou *Prazo*.
3. **Relevância:** Defina a importância base (*Baixa*, *Média* ou *Alta*).
4. **Vencimento:** Selecione a data e o horário limite (por padrão, o app sugere 2 horas à frente).
5. Toque em **Adicionar**.

---

## Formatação de Texto (Estilo Notion)

Você pode destacar trechos do título na lista principal usando marcações simples:

| Como digitar | Resultado na lista |
| :--- | :--- |
| `**texto**` | **texto** (Negrito) |
| `*texto*` | *texto* (Itálico) |
| `~~texto~~` | ~~texto~~ (Riscado) |
| `` `texto` `` | `texto` (Código / Destaque) |

**Exemplo:** `Enviar **relatório mensal** do setor `TI` antes da reunião`

*(Nota: Nos banners de alerta e nas notificações do celular, as marcações são removidas automaticamente para garantir leitura limpa e rápida).*

---

## Como Funciona a Prioridade Dinâmica

A lista se reorganiza sozinha combinando a **relevância** escolhida com o **tempo restante** até o vencimento:

* **Baixa / Média (Cinza):** Prazos distantes que não exigem ação imediata.
* **Alta (Laranja):** Tarefas importantes ou com vencimento próximo (menos de 24 horas).
* **Crítica (Vermelho):** Tarefas a menos de 2 horas do vencimento ou já atrasadas. Elas sobem automaticamente para o topo da lista e aparecem no quadro vermelho de atenção imediata (que exibe até os 3 itens mais urgentes para manter a tela organizada).

---

## Busca e Filtros Rápidos (v1.4)

Para encontrar tarefas específicas ou ver apenas um subconjunto da lista:

1. Toque no botão **Filtrar** no topo da lista (ao lado dos botões Dados e Notificações).
2. Uma gaveta será aberta com:
   * **Buscar tarefa:** Digite qualquer trecho do título ou da categoria. A lista é atualizada automaticamente à medida que você digita.
   * **Categoria:** Filtre por *Atividade*, *Compromisso* ou *Prazo*.
   * **Prioridade:** Filtre por *Baixa*, *Média*, *Alta* ou *Crítica*.
   * **Prazo:** Filtre por *Hoje*, *Esta semana* ou *Este mês*.
3. Você pode combinar quantos filtros quiser. Quando houver filtros ativos, o botão "Filtrar" mostra um pequeno número (ex: `Filtrar 2`) para lembrar que a lista está limitada.
4. Toque fora da gaveta ou no próprio botão "Filtrar" para fechá-la. Os filtros continuam aplicados até que você os limpe nos selects ou apague o texto da busca.

### Atenção: prazos críticos nunca são escondidos
O quadro vermelho de **Atenção Imediata** no topo da tela sempre mostra as tarefas mais urgentes (menos de 2 horas ou atrasadas), **mesmo que você tenha filtros ativos** na lista. Isso garante que você não perca um prazo importante por esquecer um filtro.

---

## Sistema de Notificações

Cada tarefa cadastrada agenda até **3 avisos automáticos** no celular, que funcionam mesmo com o aplicativo fechado e a tela bloqueada:

1. **No dia do evento (às 08:00):** Notificação discreta na aba superior lembrando os compromissos daquele dia.
2. **1 hora antes do prazo:** Alerta flutuante no topo da tela com vibração.
3. **No horário exato do vencimento:** Alerta flutuante no topo da tela avisando que o prazo encerrou.

---

## Como Concluir uma Tarefa

Toque na **caixa de seleção** à esquerda do título. A tarefa é removida da lista e todos os alertas futuros agendados para ela são cancelados automaticamente.

---

## Backup e Segurança dos Dados

O aplicativo funciona **100% offline** e salva suas tarefas diretamente na memória protegida do Android. Nenhuma informação é enviada para a internet.

### 1. Como atualizar o APK sem perder suas tarefas
* **Atualização normal (Recomendado):** Ao instalar uma nova versão do `app-debug.apk`, toque em **Atualizar** (instalar por cima). Todas as suas tarefas cadastradas são mantidas intactas.
* **Atenção ao desinstalar:** Se você desinstalar o aplicativo ou limpar os dados dele nas configurações do Android, todas as tarefas salvas serão apagadas.

### 2. Como fazer backup manual via Computador (ADB)
Caso precise formatar o celular ou transferir suas tarefas para outro aparelho:

1. Ative a **Depuração USB** nas *Opções do Desenvolvedor* do celular e conecte-o ao computador via cabo USB.
2. No terminal do computador (com o Android SDK instalado), execute:
   ```powershell
   adb backup -noapk com.tarefas.prazos -f backup_tarefas.ab
   ```
3. Confirme a operação na tela do celular para gerar o arquivo `backup_tarefas.ab`.
4. Para restaurar em outro aparelho Android (já com o APK instalado), conecte o novo celular e rode:
   ```powershell
   adb restore backup_tarefas.ab
   ```

---

## Configurações Recomendadas no Android

Para garantir que o sistema de economia de energia do celular não atrase nenhum alerta:

1. Ao abrir o app pela primeira vez, toque em **Notificações** no topo direito e permita o envio de alertas.
2. Acesse **Configurações do Celular > Aplicativos > Tarefas e Prazos > Bateria** e selecione **Sem restrições**.
3. No Android 12 ou superior, verifique em **Configurações do Celular > Aplicativos > Tarefas e Prazos > Alarmes e lembretes** se a permissão está ativada.
