import { writable, type Writable } from "svelte/store";
import type { Client as ApiClient } from "$lib/backend/api";

export const dbClient: Writable<ApiClient | null> = writable(null);