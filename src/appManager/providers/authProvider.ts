import { HttpError, type AuthProvider } from "react-admin";
import data from "./users.json";

type LocalUser = (typeof data.users)[number];

const persistUser = (user: LocalUser) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userToPersist } = user;
  localStorage.setItem("user", JSON.stringify(userToPersist));
};

const readUser = () => {
  const persistedUser = localStorage.getItem("user");
  return persistedUser
    ? (JSON.parse(persistedUser) as Omit<LocalUser, "password">)
    : null;
};

/**
 * Local auth provider for development.
 * Sign in with janedoe / password or johndoe / password.
 */
export const authProvider: AuthProvider = {
  login: ({ username, password }) => {
    const user = data.users.find(
      (candidate) =>
        candidate.username === username && candidate.password === password,
    );

    if (!user) {
      return Promise.reject(
        new HttpError("Unauthorized", 401, {
          message: "Invalid username or password",
        }),
      );
    }

    persistUser(user);
    return Promise.resolve();
  },
  logout: () => {
    localStorage.removeItem("user");
    return Promise.resolve();
  },
  checkError: ({ status }: { status: number }) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem("user");
      return Promise.reject();
    }
    return Promise.resolve();
  },
  checkAuth: () =>
    localStorage.getItem("user") ? Promise.resolve() : Promise.reject(),
  getPermissions: () => Promise.resolve(readUser()?.role),
  getIdentity: () => {
    const user = readUser();
    return user ? Promise.resolve(user) : Promise.reject();
  },
};

export default authProvider;
