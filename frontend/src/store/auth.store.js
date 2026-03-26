import { create } from "zustand";
import { getToken, getUser, setToken, setUser, clearAuth } from "../utils/storage";

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isLoggedIn: false,

  // Rehydrate from localStorage on app start
  initAuth: () => {
    const token = getToken();
    const user = getUser();
    if (token && user) {
      set({ token, user, isLoggedIn: true });
    }
  },

  // Set after login/register
  setAuth: (token, user) => {
    setToken(token);
    setUser(user);
    set({ token, user, isLoggedIn: true });
  },

  // Update user profile
  updateUser: (updatedUser) => {
    setUser(updatedUser);
    set({ user: updatedUser });
  },

  // Clear on logout
  logout: () => {
    clearAuth();
    set({ token: null, user: null, isLoggedIn: false });
  },

  // Getters
  getToken: () => get().token,
  getUser: () => get().user,
}));