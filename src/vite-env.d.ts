interface ImportMetaEnv {
    readonly VITE_PUBLIC_API_URL: string;
    readonly VITE_PUBLIC_WS_API_URL: string;
}
interface ImportMeta {
    readonly env: ImportMetaEnv
}