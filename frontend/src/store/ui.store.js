import { create } from "zustand";

let toastId = 0;

export const useUIStore = create((set, get) => ({
  // Toasts
  toasts: [],

  // Modals
  quickSaveOpen: false,
  confirmModal: null, // { message, onConfirm }

  // Sidebar
  sidebarOpen: true,

  // ── Toast ─────────────────────────────────────────────────────────────────
  addToast: (message, type = "success", duration = 3000) => {
    const id = ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // Shorthand helpers
  toastSuccess: (msg) => get().addToast(msg, "success"),
  toastError: (msg) => get().addToast(msg, "error"),
  toastInfo: (msg) => get().addToast(msg, "info"),

  // ── Quick Save ────────────────────────────────────────────────────────────
  openQuickSave: () => set({ quickSaveOpen: true }),
  closeQuickSave: () => set({ quickSaveOpen: false }),
  toggleQuickSave: () => set((state) => ({ quickSaveOpen: !state.quickSaveOpen })),

  // ── Confirm Modal ─────────────────────────────────────────────────────────
  openConfirm: (message, onConfirm) => set({ confirmModal: { message, onConfirm } }),
  closeConfirm: () => set({ confirmModal: null }),

  // ── Sidebar ───────────────────────────────────────────────────────────────
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));