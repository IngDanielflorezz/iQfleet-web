const USERS_KEY = 'iqfleet_usuarios';
const SESSION_KEY = 'iqfleet_session';
const REMEMBER_KEY = 'iqfleet_remembered_email';

export const initStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const initialUsers = [
      {
        correo: 'admin@iqfleet.com',
        passwordMock: '1234',
        rol: 'Administrador',
        nombre: 'Administrador del Sistema'
      },
      {
        correo: 'conductor@iqfleet.com',
        passwordMock: '1234',
        rol: 'Conductor',
        nombre: 'Conductor Principal'
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
  }
};

export const getUsers = () => {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (error) {
    console.error('Error al parsear usuarios del almacenamiento local:', error);
    return [];
  }
};

export const saveRememberedEmail = (email) => {
  if (email) {
    localStorage.setItem(REMEMBER_KEY, email);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
};

export const getRememberedEmail = () => {
  return localStorage.getItem(REMEMBER_KEY) || '';
};

export const setSession = (userData, isRemembered) => {
  const storage = isRemembered ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(userData));
};

// =========================================
// ALMACENAMIENTO GENÉRICO POR MÓDULO
// =========================================
// Helpers reutilizables por cualquier módulo (vehiculos, conductores,
// documentos, finanzas, mantenimiento...) para leer/escribir sus propias
// colecciones en localStorage bajo una key propia (ej: 'iqfleet_vehiculos').

/**
 * Obtiene datos guardados bajo una key. Devuelve null si no existe
 * o si el contenido está corrupto, para que el módulo llamante decida
 * si debe sembrar (seed) datos iniciales (mock).
 * @param {string} key
 * @returns {any|null}
 */
export const getStorageData = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Error al leer "${key}" del almacenamiento local:`, error);
    return null;
  }
};

/**
 * Guarda datos bajo una key en localStorage.
 * @param {string} key
 * @param {any} data
 * @returns {boolean} true si se guardó correctamente
 */
export const saveStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error al guardar "${key}" en el almacenamiento local:`, error);
    return false;
  }
};

/**
 * Elimina una key del almacenamiento local (útil para reset/testing).
 * @param {string} key
 */
export const removeStorageData = (key) => {
  localStorage.removeItem(key);
};