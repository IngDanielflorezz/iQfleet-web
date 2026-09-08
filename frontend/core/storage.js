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
}

// Auto-inicializar datos de usuarios si la capa mock está presente
if (typeof usuariosMock !== 'undefined') {
  Storage.initMockData('iqfleet_usuarios', usuariosMock);
}

if (typeof window !== 'undefined') {
  window.Storage = Storage;
}