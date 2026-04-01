const USERS_KEY = "snapcut_users";
const SESSION_KEY = "snapcut_current_user";

export type AuthUser = {
  name: string;
  email: string;
};

type StoredUser = AuthUser & {
  password: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const getUsers = () => readJson<StoredUser[]>(USERS_KEY, []);

export const getCurrentUser = () => readJson<AuthUser | null>(SESSION_KEY, null);

export const registerUser = (name: string, email: string, password: string) => {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = password.trim();

  if (!trimmedName || !normalizedEmail || !trimmedPassword) {
    return { ok: false, message: "Please fill in all fields." };
  }

  const users = getUsers();
  const existingUser = users.find((user) => user.email === normalizedEmail);

  if (existingUser) {
    return { ok: false, message: "An account with that email already exists." };
  }

  const newUser: StoredUser = {
    name: trimmedName,
    email: normalizedEmail,
    password: trimmedPassword,
  };

  writeJson(USERS_KEY, [...users, newUser]);
  writeJson(SESSION_KEY, { name: newUser.name, email: newUser.email });

  return { ok: true, user: { name: newUser.name, email: newUser.email } };
};

export const loginUser = (email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = password.trim();

  if (!normalizedEmail || !trimmedPassword) {
    return { ok: false, message: "Please enter your email and password." };
  }

  const users = getUsers();
  const user = users.find((entry) => entry.email === normalizedEmail);

  if (!user || user.password !== trimmedPassword) {
    return { ok: false, message: "Invalid email or password." };
  }

  const sessionUser = { name: user.name, email: user.email };
  writeJson(SESSION_KEY, sessionUser);

  return { ok: true, user: sessionUser };
};

export const logoutUser = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
};
