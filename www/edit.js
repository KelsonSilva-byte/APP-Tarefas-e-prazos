const EditManager = {
    editingId: null,

    init() {
        const modal = document.getElementById('editModal');

        document.getElementById('btnCloseEditModal').addEventListener('click', () => {
            this.close();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });

        document.getElementById('editTaskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveChanges();
        });
    },

    open(task) {
        this.editingId = task.id;
        document.getElementById('editTitle').value = task.title;
        document.getElementById('editCategory').value = task.category;
        document.getElementById('editImportance').value = String(task.importance);
        document.getElementById('editDeadline').value = task.deadline;

        document.getElementById('editModal').classList.add('open');
        document.getElementById('editTitle').focus();
    },

    close() {
        this.editingId = null;
        document.getElementById('editModal').classList.remove('open');
    },

    async saveChanges() {
        if (!this.editingId) return;

        const cleanTitle = document.getElementById('editTitle').value.trim();
        const newDeadline = document.getElementById('editDeadline').value;

        if (!cleanTitle || !newDeadline || isNaN(new Date(newDeadline).getTime())) {
            return;
        }

        const tasks = await StorageService.getTasks();
        const index = tasks.findIndex(t => t.id === this.editingId);

        if (index !== -1) {
            tasks[index].title = cleanTitle;
            tasks[index].category = document.getElementById('editCategory').value;
            tasks[index].importance = document.getElementById('editImportance').value;
            tasks[index].deadline = newDeadline;

            await StorageService.saveTasks(tasks);
            await NotificationService.syncUpcomingAlerts(tasks);
            await App.render(tasks);
        }

        this.close();
    }
};
