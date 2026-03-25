import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("theme") || "dark",

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);

      document.documentElement.setAttribute("data-theme", newTheme);
      return { theme: newTheme };
    }),
}));