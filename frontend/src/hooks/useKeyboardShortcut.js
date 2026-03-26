import { useEffect } from "react";

/**
 * Listens for a keyboard shortcut and calls the handler.
 * Usage: useKeyboardShortcut({ key: "k", meta: true }, () => openModal())
 */
export function useKeyboardShortcut({ key, meta = false, ctrl = false, shift = false }, handler) {
  useEffect(() => {
    const listener = (e) => {
      const metaMatch = meta ? (e.metaKey || e.ctrlKey) : true;
      const ctrlMatch = ctrl ? e.ctrlKey : true;
      const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
      const keyMatch = e.key.toLowerCase() === key.toLowerCase();

      if (metaMatch && ctrlMatch && shiftMatch && keyMatch) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [key, meta, ctrl, shift, handler]);
}