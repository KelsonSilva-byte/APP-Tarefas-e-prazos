const UI = {
    undoTimer: null,

    formatSafeMarkdown(text) {
        const escaped = String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        return escaped
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/~~(.+?)~~/g, '<del>$1</del>')
            .replace(/`(.+?)`/g, '<code>$1</code>');
    },

    showUndoToast(rawTitle, onUndoCallback) {
        const toast = document.getElementById('undoToast');
        const msg = document.getElementById('undoMessage');
        const clean = PriorityEngine.stripMarkdown(rawTitle);
        const shortName = clean.length > 26 ? clean.slice(0, 26) + '...' : clean;

        msg.textContent = `Concluída: ${shortName}`;
        toast.classList.add('visible');

        if (this.undoTimer) clearTimeout(this.undoTimer);
        this.undoTimer = setTimeout(() => {
            toast.classList.remove('visible');
            if (onUndoCallback) onUndoCallback();
        }, 6000);
    },

    hideUndoToast() {
        const toast = document.getElementById('undoToast');
        toast.classList.remove('visible');
        if (this.undoTimer) clearTimeout(this.undoTimer);
    },

    renderTasks(tasks, filters = {}) {
        const listEl = document.getElementById('taskList');
        const bannerEl = document.getElementById('alertBanner');

        // Banner de Atenção Imediata: calculado sobre TODAS as tarefas,
        // independente de filtros, para nunca esconder prazos críticos do usuário.
        const allTasksWithCalc = tasks
            .map(task => ({ ...task, calc: PriorityEngine.calculate(task) }));

        const urgentTitles = [];
        allTasksWithCalc.forEach(task => {
            const { hoursLeft } = task.calc;
            const isUrgent = hoursLeft <= 2;
            if (isUrgent) urgentTitles.push(task.title);
        });

        this.renderUrgentBanner(bannerEl, urgentTitles);

        // Aplicar filtros apenas para a lista visível
        const filteredTasks = FilterService.filter(tasks, filters);

        listEl.innerHTML = '';

        if (filteredTasks.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'Nenhuma tarefa encontrada.';
            listEl.appendChild(empty);
            return;
        }

        const sortedTasks = filteredTasks
            .map(task => ({ ...task, calc: PriorityEngine.calculate(task) }))
            .sort((a, b) => b.calc.totalScore - a.calc.totalScore);

        sortedTasks.forEach(task => {
            const { hoursLeft, level } = task.calc;

            const dateObj = new Date(task.deadline);
            const dateFormatted = isNaN(dateObj.getTime())
                ? 'Data inválida'
                : dateObj.toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                });

            if (isUrgent) urgentTitles.push(task.title);

            const row = document.createElement('div');
            row.className = `task-row ${level.tagClass}`;

            const mainDiv = document.createElement('div');
            mainDiv.className = 'task-main';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'checkbox-done';
            checkbox.title = 'Concluir';
            checkbox.addEventListener('change', () => App.completeTask(task.id));

            const textWrapper = document.createElement('div');
            textWrapper.style.minWidth = '0';
            textWrapper.style.flex = '1';
            textWrapper.style.cursor = 'pointer';
            textWrapper.title = 'Toque para editar';
            
            textWrapper.addEventListener('click', () => EditManager.open(task));

            textWrapper.style.minWidth = '0';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'task-title';
            titleDiv.innerHTML = this.formatSafeMarkdown(task.title);

            const catDiv = document.createElement('div');
            catDiv.className = 'task-category';
            catDiv.textContent = task.category;

            textWrapper.appendChild(titleDiv);
            textWrapper.appendChild(catDiv);
            mainDiv.appendChild(checkbox);
            mainDiv.appendChild(textWrapper);

            const metaDiv = document.createElement('div');
            metaDiv.className = 'task-meta';

            const tagSpan = document.createElement('span');
            tagSpan.className = `tag ${level.tagClass}`;
            tagSpan.textContent = level.label;

            const timeInfo = document.createElement('div');
            timeInfo.className = 'time-info';

            const timeRem = document.createElement('span');
            timeRem.className = `time-remaining ${isUrgent ? 'urgent' : ''}`;
            timeRem.textContent = PriorityEngine.formatTimeRemaining(hoursLeft);

            const timeDate = document.createElement('span');
            timeDate.className = 'time-date';
            timeDate.textContent = dateFormatted;

            timeInfo.appendChild(timeRem);
            timeInfo.appendChild(timeDate);
            metaDiv.appendChild(tagSpan);
            metaDiv.appendChild(timeInfo);

            row.appendChild(mainDiv);
            row.appendChild(metaDiv);
            listEl.appendChild(row);
        });
    },

    renderUrgentBanner(bannerEl, urgentTitles) {
        if (urgentTitles.length === 0) {
            bannerEl.style.display = 'none';
            return;
        }

        bannerEl.innerHTML = '';
        bannerEl.style.display = 'block';

        const header = document.createElement('div');
        header.textContent = 'Atenção imediata:';
        header.style.fontWeight = '600';
        header.style.marginBottom = '6px';
        bannerEl.appendChild(header);

        const MAX_VISIBLE = 3;
        urgentTitles.slice(0, MAX_VISIBLE).forEach(t => {
            const item = document.createElement('div');
            item.textContent = `— ${PriorityEngine.stripMarkdown(t)}`;
            item.style.paddingLeft = '4px';
            item.style.lineHeight = '1.4';
            bannerEl.appendChild(item);
        });

        if (urgentTitles.length > MAX_VISIBLE) {
            const extra = document.createElement('div');
            const remaining = urgentTitles.length - MAX_VISIBLE;
            extra.textContent = `+ ${remaining} ${remaining === 1 ? 'outro item crítico' : 'outros itens críticos'} na lista abaixo`;
            extra.style.fontSize = '0.78rem';
            extra.style.marginTop = '6px';
            extra.style.opacity = '0.85';
            bannerEl.appendChild(extra);
        }
    }
};
