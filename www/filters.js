const FilterService = {
    // Filtra tarefas por busca, categoria, urgência e prazo
    filter(tasks, { searchQuery, categoryFilter, urgencyFilter, deadlineFilter } = {}) {
        return tasks.filter(task => {
            // 1. Busca por título ou categoria (case-insensitive, parcial)
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const title = (task.title || '').toLowerCase();
                const category = (task.category || '').toLowerCase();
                if (!title.includes(q) && !category.includes(q)) return false;
            }

            // 2. Filtro por categoria (exato)
            if (categoryFilter && task.category !== categoryFilter) return false;

            // 3. Filtro por urgência/nível de prioridade (calculado)
            if (urgencyFilter) {
                const calc = PriorityEngine.calculate(task);
                if (calc.level.label !== urgencyFilter) return false;
            }

            // 4. Filtro por prazo (relativo a agora)
            if (deadlineFilter) {
                const now = Date.now();
                const due = new Date(task.deadline).getTime();
                if (isNaN(due)) return false;

                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                const startOfWeek = new Date(startOfToday);
                startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
                const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

                const endOfToday = new Date(startOfToday);
                endOfToday.setDate(endOfToday.getDate() + 1);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 7);
                const endOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 1);

                let inRange = false;
                if (deadlineFilter === 'today') {
                    inRange = due >= startOfToday.getTime() && due < endOfToday.getTime();
                } else if (deadlineFilter === 'week') {
                    inRange = due >= startOfWeek.getTime() && due < endOfWeek.getTime();
                } else if (deadlineFilter === 'month') {
                    inRange = due >= startOfMonth.getTime() && due < endOfMonth.getTime();
                }
                if (!inRange) return false;
            }

            return true;
        });
    }
};