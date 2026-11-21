const { Preferences } = Capacitor.Plugins;

const StorageService = {
    KEY: 'smartTasks_android_v1',

    async getTasks() {
        try {
            const { value } = await Preferences.get({ key: this.KEY });
            if (!value) return [];
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.error('Erro ao ler dados salvos:', err);
            return [];
        }
    },

    async saveTasks(tasks) {
        try {
            await Preferences.set({
                key: this.KEY,
                value: JSON.stringify(tasks)
            });
        } catch (err) {
            console.error('Erro ao salvar dados:', err);
        }
    },

    async addTask(task) {
        const tasks = await this.getTasks();
        tasks.push(task);
        await this.saveTasks(tasks);
    },

    async removeTask(id) {
        const tasks = await this.getTasks();
        const filtered = tasks.filter(t => t.id !== id);
        await this.saveTasks(filtered);
    }
};
