import { writable } from 'svelte/store';
import type { SvelteComponent } from 'svelte';

type ModalContent = {
  component?: typeof SvelteComponent | null;
  props?: Record<string, any> | null;
  title?: string | null;
  description?: string | null;
  open?: boolean;
};

const defaultState: ModalContent = {
  component: null,
  props: null,
  title: null,
  description: null,
  open: false,
};

export const modalStore = writable<ModalContent>({ ...defaultState });

export function openModal(details: Partial<ModalContent>) {
  modalStore.set({ ...defaultState, ...details, open: true });
}

export function closeModal() {
  modalStore.set({ ...defaultState });
}

export default modalStore;
