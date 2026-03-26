import { useUIStore } from "../store/ui.store";

export function useToast() {
  const { addToast, removeToast, toasts, toastSuccess, toastError, toastInfo } = useUIStore();
  return { addToast, removeToast, toasts, toastSuccess, toastError, toastInfo };
}