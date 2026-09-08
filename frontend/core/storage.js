class Storage {
    static get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
    
    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));       
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static initMockData(key, defaultData) {
        if (!localStorage.getItem(key)) {
            this.set(key, defaultData);
        }   
    }

    // Métodos para el manejo de sesión activa
    static setSession(user) {
        this.set('iqfleet_user', user);
        this.set('iqfleet_token', 'mock_jwt_token_' + Date.now());
    }

    static getSession() {
        return this.get('iqfleet_user');
    }

    static logout() {
        this.remove('iqfleet_user');
        this.remove('iqfleet_token');
    }
}

// Auto-inicializar datos de usuarios si la capa mock está presente
if (typeof usuariosMock !== 'undefined') {
    Storage.initMockData('iqfleet_usuarios', usuariosMock);
}

if (typeof window !== 'undefined') {
    window.Storage = Storage;
}