const BackupManager = {
    init() {
        const modal = document.getElementById('backupModal');
        const textarea = document.getElementById('backupTextarea');
        const feedback = document.getElementById('backupFeedback');

        document.getElementById('btnBackupModal').addEventListener('click', async () => {
            const tasks = await StorageService.getTasks();
            textarea.value = JSON.stringify(tasks, null, 2);
            feedback.textContent = `${tasks.length} tarefa(s) pronta(s) para exportação.`;
            modal.classList.add('open');
        });

        document.getElementById('btnCloseModal').addEventListener('click', () => {
            modal.classList.remove('open');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });

        document.getElementById('btnCopyJson').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(textarea.value);
                feedback.textContent = 'Backup copiado para a área de transferência.';
            } catch {
                textarea.select();
                document.execCommand('copy');
                feedback.textContent = 'Texto selecionado. Copie manualmente se necessário.';
            }
        });

        document.getElementById('btnDownloadJson').addEventListener('click', () => {
            const blob = new Blob([textarea.value], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_tarefas_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            feedback.textContent = 'Download iniciado.';
        });

        document.getElementById('fileImportJson').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                textarea.value = ev.target.result;
                feedback.textContent = 'Arquivo carregado. Clique em "Restaurar Tarefas" para confirmar.';
            };
            reader.readAsText(file);
        });

        document.getElementById('btnImportText').addEventListener('click', async () => {
            await this.importTasksFromJson(textarea.value, feedback);
        });
    },

    async importTasksFromJson(rawJson, feedbackEl) {
        try {
            const parsed = JSON.parse(rawJson);
            if (!Array.isArray(parsed)) {
                feedbackEl.textContent = 'Formato inválido: o backup deve ser uma lista JSON.';
                return;
            }

            const validTasks = parsed.filter(item =>
                item &&
                typeof item.title === 'string' &&
                item.title.trim().length > 0 &&
                typeof item.deadline === 'string' &&
                !isNaN(new Date(item.deadline).getTime())
            ).map((item, index) => ({
                id: item.id || (Date.now() + index),
                notifBaseId: 0,
                title: item.title.trim(),
                category: ['Atividade', 'Compromisso', 'Prazo'].includes(item.category) ? item.category : 'Atividade',
                importance: ['1', '2', '3'].includes(String(item.importance)) ? String(item.importance) : '2',
                deadline: item.deadline
            }));

            if (validTasks.length === 0 && parsed.length > 0) {
                feedbackEl.textContent = 'Nenhuma tarefa válida encontrada no texto.';
                return;
            }

            const finalTasks = [];
            validTasks.forEach(t => {
                t.notifBaseId = App.generateUniqueNotifId(finalTasks);
                finalTasks.push(t);
            });

            await StorageService.saveTasks(finalTasks);
            await NotificationService.syncUpcomingAlerts(finalTasks);
            await App.render(finalTasks);

            feedbackEl.textContent = `${finalTasks.length} tarefa(s) restaurada(s) com sucesso.`;
        } catch (err) {
            feedbackEl.textContent = 'Erro de sintaxe JSON. Verifique o texto colado.';
        }
    }
};
