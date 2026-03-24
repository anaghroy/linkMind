import { create } from "zustand";
import { getToken, getUser, setToken, setUser, clearAuth } from "../utils/storage";

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  isLoggedIn: false,

  initAuth: () => {
    const token = getToken();
    const user = getUser();
    if (token && user) {
      set({ token, user, isLoggedIn: true });
    }
  },

  setAuth: (token, user) => {
    setToken(token);
    setUser(user);
    set({ token, user, isLoggedIn: true });
  },

  logout: () => {
    clearAuth();
    set({ token: null, user: null, isLoggedIn: false });
  },
}));