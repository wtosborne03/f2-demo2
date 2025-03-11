import { getToastStore } from "@skeletonlabs/skeleton";

export const setupErrorHandling = () => {
    const toast = getToastStore();

    const report_error = (msg: string = "unknown error") => {
        toast.trigger({
            message: `Unhandled error: ${msg}`,
        });
    };

    const handle_rejection = (e: PromiseRejectionEvent) => {
        e.preventDefault();
        report_error(e?.reason);
    };

    const handle_error = (e: ErrorEvent) => {
        e.preventDefault();
        report_error(e?.message);
    };

    window.addEventListener("unhandledrejection", handle_rejection);
    window.addEventListener("error", handle_error);

    return () => {
        window.removeEventListener("unhandledrejection", handle_rejection);
        window.removeEventListener("error", handle_error);
    };
};