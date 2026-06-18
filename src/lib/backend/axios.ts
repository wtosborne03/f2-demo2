import { OpenAPIClientAxios } from "openapi-client-axios";
import type { Client as ApiClient } from "./api";
import axios from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_PUBLIC_API_URL,
    withCredentials: true,
});

instance.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        let tempUserId = localStorage.getItem("temp_user_id");
        if (!tempUserId) {
            tempUserId = "temp_" + crypto.randomUUID();
            localStorage.setItem("temp_user_id", tempUserId);
        }
        config.headers["x-temp-user-id"] = tempUserId;
    }
    return config;
});

let initializedApiPromise: Promise<ApiClient> | null = null;

const getApiPromise = (): Promise<ApiClient> => {
    if (typeof window === 'undefined') {
        return Promise.resolve(null as unknown as ApiClient);
    }
    if (!initializedApiPromise) {
        const api = new OpenAPIClientAxios({
            definition: `${import.meta.env.VITE_PUBLIC_API_URL}/openapi/json`,
            axiosInstance: instance
        });
        initializedApiPromise = api.init<ApiClient>();
    }
    return initializedApiPromise;
};

const apiClient = {
    then(onfulfilled?: (value: ApiClient) => any, onrejected?: (reason: any) => any) {
        return getApiPromise().then(onfulfilled, onrejected);
    },
    catch(onrejected?: (reason: any) => any) {
        return getApiPromise().catch(onrejected);
    },
    finally(onfinally?: () => void) {
        return getApiPromise().finally(onfinally);
    }
} as Promise<ApiClient>;

export { apiClient };