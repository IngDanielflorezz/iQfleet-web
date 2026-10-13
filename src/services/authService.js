const USERS_KEY = "iqfleet_users";
const SESSION_KEY = "iqfleet_session";

export const ROLES = {
  ADMINISTRADOR: "ADMINISTRADOR",
  CONDUCTOR: "CONDUCTOR",
};

const DEMO_ADMIN = {
  id: 1,
  nombres: "Carlos",
  apellidos: "Morales",
  correo: "admin@iqfleet.com",
  telefono: "+57 300 000 0000",
  empresa: "iQFleet",
  password: "1234",
  rol: ROLES.ADMINISTRADOR,
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function ensureSeedUser() {
  const users = readUsers();
  if (users.length === 0) {
    writeUsers([DEMO_ADMIN]);
  }
}

// TODO (cuando exista el backend):
// const res = await fetch("http://localhost:8080/api/auth/register", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify(data),
// });
// if (!res.ok) throw new Error((await res.json()).message);
// return res.json();
export async function registerUser(data) {
  await delay(600);
  ensureSeedUser();
  const users = readUsers();
  const correo = data.correo.trim().toLowerCase();

  if (users.some((user) => user.correo === correo)) {
    throw new Error("Ya existe una cuenta con ese correo.");
  }

  const nuevo = { id: Date.now(), ...data, correo };
  writeUsers([...users, nuevo]);
  return nuevo;
}

export async function loginUser({ correo, password, rol }) {
  await delay(400);
  ensureSeedUser();
  const user = readUsers().find(
    (candidate) =>
      candidate.correo === correo.trim().toLowerCase() &&
      candidate.password === password &&
      candidate.rol === rol,
  );

  if (!user) {
    throw new Error("Credenciales o rol incorrectos.");
  }
  return user;
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    return session ?? null;
  } catch {
    return null;
  }
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
