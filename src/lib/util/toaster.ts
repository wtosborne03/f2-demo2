import { snackbar } from "m3-svelte";

export const toaster = {
  create: (options: { title: string; description?: string }) => {
    snackbar(options.title + (options.description ? `: ${options.description}` : ""), undefined, true);
  },
  error: (options: { title: string; description?: string }) => {
    snackbar(`Error: ${options.title}` + (options.description ? ` - ${options.description}` : ""), undefined, true);
  },
  success: (options: { title: string; description?: string }) => {
    snackbar(options.title + (options.description ? `: ${options.description}` : ""), undefined, true);
  },
  warning: (options: { title: string; description?: string }) => {
    snackbar(options.title + (options.description ? `: ${options.description}` : ""), undefined, true);
  }
};