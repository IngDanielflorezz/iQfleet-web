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