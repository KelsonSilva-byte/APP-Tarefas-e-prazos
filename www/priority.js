const PriorityEngine = {
    stripMarkdown(text) {
        if (!text) return '';
        return String(text)
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/~~(.+?)~~/g, '$1')
            .replace(/`(.+?)`/g, '$1');
    },

    calculate(task) {
        const now = Date.now();
        const due = new Date(task.deadline).getTime();

        // Proteção contra data inválida ou vazia (evita NaN que quebra a ordenação)
        if (isNaN(due)) {
            return {
                totalScore: 0,
                hoursLeft: 9999,
                level: { label: 'Baixa', tagClass: 'tag-baixa' }
            };
        }

        const hoursLeft = (due - now) / (1000 * 60 * 60);
        let urgencyScore = 0;

        if (hoursLeft <= 0) {
            urgencyScore = 100;
        } else if (hoursLeft <= 2) {
            urgencyScore = 80;
        } else if (hoursLeft <= 12) {
            urgencyScore = 60;
        } else if (hoursLeft <= 24) {
            urgencyScore = 40;
        } else if (hoursLeft <= 72) {
            urgencyScore = 20;
        } else {
            urgencyScore = 5;
        }

        const importanceVal = parseInt(task.importance, 10) || 2;
        const totalScore = (importanceVal * 10) + urgencyScore;

        let level = { label: 'Baixa', tagClass: 'tag-baixa' };
        if (totalScore >= 85) {
            level = { label: 'Crítica', tagClass: 'tag-critica' };
        } else if (totalScore >= 60) {
            level = { label: 'Alta', tagClass: 'tag-alta' };
        } else if (totalScore >= 35) {
            level = { label: 'Média', tagClass: 'tag-media' };
        }

        return { totalScore, hoursLeft, level };
    },

    formatTimeRemaining(hoursLeft) {
        if (!isFinite(hoursLeft) || isNaN(hoursLeft)) {
            return 'Sem prazo';
        }
        if (hoursLeft <= 0) {
            const overdue = Math.abs(hoursLeft);
            return overdue < 1
                ? `Atrasado (${Math.round(overdue * 60)} min)`
                : `Atrasado (${Math.floor(overdue)} h)`;
        }
        if (hoursLeft < 1) {
            return `Em ${Math.ceil(hoursLeft * 60)} min`;
        }
        if (hoursLeft < 24) {
            const h = Math.floor(hoursLeft);
            const m = Math.round((hoursLeft - h) * 60);
            return `Em ${h}h ${m}m`;
        }
        const days = Math.floor(hoursLeft / 24);
        const remHours = Math.floor(hoursLeft % 24);
        return `Em ${days}d ${remHours}h`;
    }
};
