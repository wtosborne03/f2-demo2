import OpenAPIClientAxios from "openapi-client-axios";
import type { Client as ApiClient } from "./api";
import axios from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_PUBLIC_API_URL,
    withCredentials: true,
});

// Conditionally initialize to avoid SSR issues
let apiClient: Promise<ApiClient> | null = null;

if (typeof window !== 'undefined') {
    const api = new OpenAPIClientAxios({
        definition: `${import.meta.env.VITE_PUBLIC_API_URL}/openapi/json`,
        axiosInstance: instance
    });
    apiClient = api.init<ApiClient>();
}

export { apiClient };