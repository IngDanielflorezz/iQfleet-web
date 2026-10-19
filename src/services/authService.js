const USERS_KEY = "iqfleet_users";
const SESSION_KEY = "iqfleet_session";

export const ROLES = {
  ADMINISTRADOR: "ADMINISTRADOR",
  CONDUCTOR: "CONDUCTOR",
};

// Usuarios demo. Cada administrador representa una empresa que contrató iQFleet
// (empresa contratante). Los conductores solo pueden registrarse en una de ellas.
const DEMO_USERS = [
  {
    id: 1,
    nombres: "Carlos",
    apellidos: "Morales",
    correo: "admin@iqfleet.com",
    telefono: "+57 300 000 0000",
    empresa: "iQFleet",
    password: "1234",
    rol: ROLES.ADMINISTRADOR,
  },
  {
    id: 2,
    nombres: "Andrés",
    apellidos: "Gómez",
    correo: "conductor@iqfleet.com",
    telefono: "+57 301 000 0000",
    empresa: "iQFleet",
    licencia: "20001234567",
    password: "1234",
    rol: ROLES.CONDUCTOR,
  },
];

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

function ensureSeedUsers() {
  const users = readUsers();
  const missing = DEMO_USERS.filter(
    (demo) => !users.some((user) => user.correo === demo.correo),
  );
  if (missing.length > 0) {
    writeUsers([...users, ...missing]);
  }
}

/**
 * Empresas contratantes: empresas que ya tienen una cuenta de administrador.
 * Son las únicas bajo las que un conductor puede registrarse / iniciar sesión.
 */
export function getEmpresasContratantes() {
  const empresas = readUsers()
    .filter((user) => user.rol === ROLES.ADMINISTRADOR)
    .map((user) => (user.empresa ?? "").trim())
    .filter(Boolean);

  return [...new Set(empresas)].sort((a, b) => a.localeCompare(b, "es"));
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
  ensureSeedUsers();
  const users = readUsers();
  const correo = data.correo.trim().toLowerCase();

  if (users.some((user) => user.correo === correo)) {
    throw new Error("Ya existe una cuenta con ese correo.");
  }

  if (
    data.rol === ROLES.CONDUCTOR &&
    !getEmpresasContratantes().some((empresa) => matchesEmpresa(empresa, data.empresa))
  ) {
    throw new Error("La empresa seleccionada no está registrada como empresa contratante.");
  }

  const nuevo = { id: Date.now(), ...data, correo };
  writeUsers([...users, nuevo]);
  return nuevo;
}

export async function loginUser({ correo, password, rol, empresa }) {
  await delay(400);
  ensureSeedUsers();
  const user = readUsers().find(
    (candidate) =>
      candidate.correo === correo.trim().toLowerCase() &&
      candidate.password === password &&
      candidate.rol === rol,
  );

  if (!user) {
    throw new Error("Credenciales o rol incorrectos.");
  }

  if (user.rol === ROLES.CONDUCTOR && !matchesEmpresa(user.empresa, empresa)) {
    throw new Error("La empresa no coincide con la registrada para este conductor.");
  }

  return user;
}

function matchesEmpresa(registrada, ingresada) {
  const registradaNormalizada = (registrada ?? "").trim().toLowerCase();
  const ingresadaNormalizada = (ingresada ?? "").trim().toLowerCase();
  return registradaNormalizada.length > 0 && registradaNormalizada === ingresadaNormalizada;
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

ensureSeedUsers();
