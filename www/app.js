const App = {
    isSubmitting: false,
    lastDeletedTask: null,
    currentFilters: {
        searchQuery: '',
        categoryFilter: '',
        urgencyFilter: '',
        deadlineFilter: ''
    },
    drawerOpen: false,

    async init() {
        this.setDefaultDateTime();
        await NotificationService.requestPermission();
        this.bindEvents();
        BackupManager.init();
        EditManager.init();
        this.bindFilterEvents();


        const tasks = await this.ensureUniqueNotifIds();
        await NotificationService.syncUpcomingAlerts(tasks);
        await this.renderWithFilters(tasks);

        setInterval(() => {
            if (!document.hidden) this.renderWithFilters();
        }, 30000);

        document.addEventListener('resume', async () => {
            const currentTasks = await StorageService.getTasks();
            await NotificationService.syncUpcomingAlerts(currentTasks);
            await this.renderWithFilters(currentTasks);
        });
    },

    generateUniqueNotifId(existingTasks) {
        const usedIds = new Set(existingTasks.map(t => t.notifBaseId));
        let candidate;
        do {
            candidate = (Math.floor(Math.random() * 600000) + 1) * 10;
        } while (usedIds.has(candidate));
        return candidate;
    },

    async ensureUniqueNotifIds() {
        const tasks = await StorageService.getTasks();
        let changed = false;
        tasks.forEach(t => {
            if (!t.notifBaseId) {
                t.notifBaseId = this.generateUniqueNotifId(tasks);
                changed = true;
            }
        });
        if (changed) await StorageService.saveTasks(tasks);
        return tasks;
    },

    setDefaultDateTime() {
        const now = new Date();
        now.setHours(now.getHours() + 2);
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('deadline').value = now.toISOString().slice(0, 16);
    },

    bindEvents() {
        document.getElementById('btnNotify').addEventListener('click', async () => {
            await NotificationService.requestPermission();
        });

        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this.isSubmitting) return;

            const titleInput = document.getElementById('title');
            const deadlineInput = document.getElementById('deadline');
            const cleanTitle = titleInput.value.trim();

            if (!cleanTitle || !deadlineInput.value || isNaN(new Date(deadlineInput.value).getTime())) {
                return;
            }

            this.isSubmitting = true;
            try {
                const currentTasks = await StorageService.getTasks();
                const newTask = {
                    id: Date.now(),
                    notifBaseId: this.generateUniqueNotifId(currentTasks),
                    title: cleanTitle,
                    category: document.getElementById('category').value,
                    importance: document.getElementById('importance').value,
                    deadline: deadlineInput.value
                };

                currentTasks.push(newTask);
                await StorageService.saveTasks(currentTasks);
                await NotificationService.syncUpcomingAlerts(currentTasks);

                titleInput.value = '';
                await this.render(currentTasks);
            } finally {
                this.isSubmitting = false;
            }
        });

        document.getElementById('btnUndo').addEventListener('click', async () => {
            await this.undoCompleteTask();
        });
    },

    bindFilterEvents() {
        const btnToggle = document.getElementById('btnToggleFilter');
        const drawer = document.getElementById('filterDrawer');
        const badge = document.getElementById('filterBadge');
        const searchInput = document.getElementById('searchInput');
        const filterCategory = document.getElementById('filterCategory');
        const filterUrgency = document.getElementById('filterUrgency');
        const filterDeadline = document.getElementById('filterDeadline');

        const updateBadge = () => {
            let count = 0;
            if (this.currentFilters.searchQuery) count++;
            if (this.currentFilters.categoryFilter) count++;
            if (this.currentFilters.urgencyFilter) count++;
            if (this.currentFilters.deadlineFilter) count++;
            badge.textContent = count;
            if (count > 0) {
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        };

        const applyAndRender = async () => {
            await this.renderWithFilters();
            updateBadge();
        };

        // Toggle da gaveta
        btnToggle.addEventListener('click', () => {
            this.toggleDrawer();
        });

        // Fechar gaveta ao clicar fora
        document.addEventListener('click', (e) => {
            if (this.drawerOpen && !drawer.contains(e.target) && !btnToggle.contains(e.target)) {
                this.closeDrawer();
            }
        });

        // Busca instantânea
        searchInput.addEventListener('input', (e) => {
            this.currentFilters.searchQuery = e.target.value.trim();
            applyAndRender();
        });

        // Filtros por select
        filterCategory.addEventListener('change', (e) => {
            this.currentFilters.categoryFilter = e.target.value;
            applyAndRender();
        });

        filterUrgency.addEventListener('change', (e) => {
            this.currentFilters.urgencyFilter = e.target.value;
            applyAndRender();
        });

        filterDeadline.addEventListener('change', (e) => {
            this.currentFilters.deadlineFilter = e.target.value;
            applyAndRender();
        });
    },

    toggleDrawer() {
        const drawer = document.getElementById('filterDrawer');
        const btnToggle = document.getElementById('btnToggleFilter');
        if (this.drawerOpen) {
            this.closeDrawer();
        } else {
            drawer.classList.add('open');
            btnToggle.classList.add('active');
            this.drawerOpen = true;
            document.getElementById('searchInput').focus();
        }
    },

    closeDrawer() {
        const drawer = document.getElementById('filterDrawer');
        const btnToggle = document.getElementById('btnToggleFilter');
        drawer.classList.remove('open');
        btnToggle.classList.remove('active');
        this.drawerOpen = false;
    },

    async renderWithFilters(preloadedTasks = null) {
        const tasks = preloadedTasks || await StorageService.getTasks();
        UI.renderTasks(tasks, this.currentFilters);
    },

    async completeTask(id) {
        const tasks = await StorageService.getTasks();
        const target = tasks.find(t => t.id === id);
        if (!target) return;

        this.lastDeletedTask = target;
        const filtered = tasks.filter(t => t.id !== id);

        await StorageService.saveTasks(filtered);
        await NotificationService.syncUpcomingAlerts(filtered);
        await this.render(filtered);

        UI.showUndoToast(target.title, () => {
            this.lastDeletedTask = null;
        });
    },

    async undoCompleteTask() {
        if (!this.lastDeletedTask) return;
        UI.hideUndoToast();

        const tasks = await StorageService.getTasks();
        if (!tasks.some(t => t.id === this.lastDeletedTask.id)) {
            tasks.push(this.lastDeletedTask);
            await StorageService.saveTasks(tasks);
            await NotificationService.syncUpcomingAlerts(tasks);
            await this.render(tasks);
        }
        this.lastDeletedTask = null;
    },

    async render(preloadedTasks = null) {
        const tasks = preloadedTasks || await StorageService.getTasks();
        UI.renderTasks(tasks);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
