import { writable } from "svelte/store";

export interface SnackbarMessage {
  id: number;
  message: string;
  actionText?: string;
  onAction?: () => void;
  timeout?: number;
}

let nextId = 0;
export const snackbars = writable<SnackbarMessage[]>([]);

export function snackbar(message: string, actionText?: string, focus?: boolean) {
  const id = nextId++;
  const newMsg: SnackbarMessage = {
    id,
    message,
    actionText,
    timeout: 4000
  };

  snackbars.update((list) => [...list, newMsg]);

  setTimeout(() => {
    snackbars.update((list) => list.filter((m) => m.id !== id));
  }, 4000);
}
