const { LocalNotifications } = Capacitor.Plugins;

const NotificationService = {
    CHANNEL_DAILY: 'prazos_dia_v1',
    CHANNEL_URGENT: 'prazos_urgentes_v1',

    async setupChannels() {
        try {
            await LocalNotifications.createChannel({
                id: this.CHANNEL_DAILY,
                name: 'Lembretes do Dia',
                description: 'Resumo de compromissos e prazos do dia',
                importance: 3,
                visibility: 1
            });

            await LocalNotifications.createChannel({
                id: this.CHANNEL_URGENT,
                name: 'Alertas Críticos de Prazo',
                description: 'Avisos de 1 hora antes e vencimento imediato',
                importance: 5,
                visibility: 1,
                vibration: true
            });
        } catch (err) {
            console.warn('Canais não configurados:', err);
        }
    },

    async requestPermission() {
        try {
            const status = await LocalNotifications.requestPermissions();
            const btn = document.getElementById('btnNotify');
            if (status.display === 'granted') {
                await this.setupChannels();
                if (btn) btn.textContent = "Notificações ativas";
            }
        } catch (err) {
            console.warn('Permissão de notificação indisponível:', err);
        }
    },

    // Sincroniza apenas os próximos 100 alarmes (evita o limite fatal de 500 alarmes do Android)
    async syncUpcomingAlerts(tasks) {
        try {
            await this.setupChannels();

            const pending = await LocalNotifications.getPending();
            if (pending.notifications && pending.notifications.length > 0) {
                await LocalNotifications.cancel({ notifications: pending.notifications });
            }

            const now = Date.now();
            const futureTasks = tasks
                .filter(t => new Date(t.deadline).getTime() > now)
                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                .slice(0, 100); // Máximo de 100 tarefas (até 300 alarmes, seguro abaixo do limite 500)

            const notifications = [];

            futureTasks.forEach(task => {
                const cleanTitle = PriorityEngine.stripMarkdown(task.title);
                const dueDate = new Date(task.deadline);
                const dueTime = dueDate.getTime();
                const baseId = task.notifBaseId;

                // 1. No dia do evento às 08:00 (Prioridade 3)
                const morningOfEvent = new Date(
                    dueDate.getFullYear(),
                    dueDate.getMonth(),
                    dueDate.getDate(),
                    8, 0, 0
                );
                if (morningOfEvent.getTime() > now && (dueTime - morningOfEvent.getTime()) > (60 * 60 * 1000)) {
                    const horaFormatada = dueDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    notifications.push({
                        id: baseId + 1,
                        channelId: this.CHANNEL_DAILY,
                        title: `Hoje às ${horaFormatada}: ${cleanTitle}`,
                        body: `Compromisso/Prazo agendado para hoje (${task.category}).`,
                        schedule: { at: morningOfEvent, allowWhileIdle: true }
                    });
                }

                // 2. 1 hora antes (Prioridade 5)
                const oneHourBefore = dueTime - (60 * 60 * 1000);
                if (oneHourBefore > now) {
                    notifications.push({
                        id: baseId + 2,
                        channelId: this.CHANNEL_URGENT,
                        title: `Falta 1 hora: ${cleanTitle}`,
                        body: `O prazo desta ${task.category.toLowerCase()} encerra em 60 minutos.`,
                        schedule: { at: new Date(oneHourBefore), allowWhileIdle: true }
                    });
                }

                // 3. Na hora exata (Prioridade 5)
                if (dueTime > now) {
                    notifications.push({
                        id: baseId + 3,
                        channelId: this.CHANNEL_URGENT,
                        title: `Prazo encerrado: ${cleanTitle}`,
                        body: `O horário limite definido chegou agora.`,
                        schedule: { at: new Date(dueTime), allowWhileIdle: true }
                    });
                }
            });

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
            }
        } catch (err) {
            console.warn('Falha ao agendar alarmes no Android:', err);
        }
    }
};
