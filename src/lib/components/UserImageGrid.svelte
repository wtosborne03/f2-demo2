<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { dbClient } from "../../stores/apiClient";
    import { apiClient } from "$lib/backend/axios";
    import Spinner from "./spinner.svelte";
    import {
        getCacheKey,
        getCached,
        isStale,
        updateCache,
        invalidateCache,
        type GameImage,
    } from "$lib/util/imageCache";

    // Component Props
    export let userId: string;
    export let gameId: number | undefined = undefined;

    let images: GameImage[] = [];
    let loading = true;
    let error: string | null = null;
    /** Shown when a background revalidation is running on top of cached data. */
    let revalidating = false;

    // Pagination State
    let page = 0;
    const limit = 24;
    let hasMore = true;
    let loadingMore = false;
    let scrollAnchor: HTMLDivElement;
    let observer: IntersectionObserver | null = null;

    // Lightbox State
    let activeIndex: number | null = null;

    $: cacheKey = getCacheKey(userId, gameId);

    /**
     * Fetch a single page from the API, update the in-memory cache, and
     * update local component state.
     *
     * @param targetPage  Which page to fetch (0 = first).
     * @param isReset     When true this is a fresh load / revalidation of p0.
     * @param silent      When true, don't flip the global loading flags (used
     *                    for background revalidation so cached data stays visible).
     */
    async function fetchPage(targetPage: number, isReset: boolean, silent: boolean) {
        let client = get(dbClient);
        if (!client) {
            client = await apiClient;
            if (client) {
                dbClient.set(client);
            }
        }
        if (!client) throw new Error("API Client not loaded");

        const offset = targetPage * limit;
        const response = await (client as any).get(`/users/${userId}/images`, {
            params: {
                limit: String(limit),
                offset: String(offset),
                ...(gameId !== undefined ? { gameId: String(gameId) } : {}),
            },
        });

        const newImages: GameImage[] = response.data || [];

        // Update the cache
        const entry = await updateCache(cacheKey, targetPage, newImages, limit);

        if (!silent) {
            // For non-silent fetches directly apply to component state
            if (isReset) {
                images = entry.images;
            } else {
                images = entry.images;
            }
            page = entry.nextPage;
            hasMore = !entry.exhausted;
        } else {
            // Silent revalidation: swap in fresh data only after it arrives
            images = entry.images;
            page = entry.nextPage;
            hasMore = !entry.exhausted;
        }
    }

    /**
     * Main fetch orchestrator. Supports:
     *  - Hard reset (reset=true): clears cache, shows spinner, fetches from p0.
     *  - Cache-first load (reset=false, page=0): serve cached data instantly,
     *    then revalidate in background if stale.
     *  - Infinite-scroll next page: fetch next page, append, cache.
     */
    async function fetchImages(reset = false) {
        if (reset) {
            // Hard refresh – invalidate cache and start over
            invalidateCache(cacheKey);
            images = [];
            page = 0;
            hasMore = true;
            loading = true;
            error = null;

            try {
                await fetchPage(0, true, false);
            } catch (e: any) {
                console.error("Failed to load user images:", e);
                error = e.message || "Failed to load images";
            } finally {
                loading = false;
            }
            return;
        }

        // --- Infinite scroll: fetch the next page ---
        if (page > 0 || images.length > 0) {
            if (!hasMore) return;
            loadingMore = true;
            try {
                await fetchPage(page, false, false);
            } catch (e: any) {
                console.error("Failed to load more images:", e);
                error = e.message || "Failed to load images";
            } finally {
                loadingMore = false;
            }
            return;
        }

        // --- Initial mount: cache-first ---
        const cached = await getCached(cacheKey);
        if (cached) {
            // Serve stale data immediately so the UI paints at once
            images = cached.images;
            page = cached.nextPage;
            hasMore = !cached.exhausted;
            loading = false;

            if (isStale(cached)) {
                // Background revalidation – doesn't block UI
                revalidating = true;
                try {
                    await fetchPage(0, true, true);
                } catch (e: any) {
                    console.error("Background revalidation failed:", e);
                    // Keep stale data visible; don't show an error banner
                } finally {
                    revalidating = false;
                }
            }
        } else {
            // No cache yet – normal loading spinner
            loading = true;
            error = null;
            try {
                await fetchPage(0, true, false);
            } catch (e: any) {
                console.error("Failed to load user images:", e);
                error = e.message || "Failed to load images";
            } finally {
                loading = false;
            }
        }
    }

    /** Called by the "Refresh" button in the UI for a hard cache-busting reload. */
    function hardRefresh() {
        fetchImages(true);
    }

    // CORS-safe download trigger
    async function downloadImage(url: string, e?: Event) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const filename = url.substring(url.lastIndexOf("/") + 1) || "creation.png";
            const cleanedFilename = filename.split("?")[0];

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = cleanedFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Failed to download natively, opening in new window instead:", err);
            window.open(url, "_blank");
        }
    }

    function openLightbox(index: number) {
        activeIndex = index;
        if (typeof document !== "undefined") {
            document.body.style.overflow = "hidden";
        }
    }

    function closeLightbox() {
        activeIndex = null;
        if (typeof document !== "undefined") {
            document.body.style.overflow = "";
        }
    }

    function prevImage(e: Event) {
        e.stopPropagation();
        if (activeIndex !== null && images.length > 0) {
            activeIndex = (activeIndex - 1 + images.length) % images.length;
        }
    }

    function nextImage(e: Event) {
        e.stopPropagation();
        if (activeIndex !== null && images.length > 0) {
            activeIndex = (activeIndex + 1) % images.length;
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (activeIndex === null) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") prevImage(e);
        if (e.key === "ArrowRight") nextImage(e);
    }

    onMount(() => {
        fetchImages(true);

        // Set up Infinite Scroll observer
        if (typeof window !== "undefined" && window.IntersectionObserver) {
            observer = new IntersectionObserver(
                (entries) => {
                    const first = entries[0];
                    if (first.isIntersecting && !loading && !loadingMore && hasMore) {
                        fetchImages(false);
                    }
                },
                {
                    rootMargin: "200px", // Trigger loads early
                },
            );

            if (scrollAnchor) {
                observer.observe(scrollAnchor);
            }
        }

        return () => {
            if (observer) observer.disconnect();
            if (typeof document !== "undefined") {
                document.body.style.overflow = "";
            }
        };
    });
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="grid-wrapper">
    {#if loading && images.length === 0}
        <div class="spinner-container">
            <Spinner />
            <span class="loading-text">Fetching your creations...</span>
        </div>
    {:else if error && images.length === 0}
        <div class="error-container">
            <p class="error-text">⚠️ {error}</p>
            <button class="retry-btn" onclick={() => fetchImages(true)}>Retry</button>
        </div>
    {:else if images.length === 0}
        <div class="empty-container">
            <div class="empty-icon">🎨</div>
            <p class="empty-text">No images generated in this session yet.</p>
        </div>
    {:else}
        <!-- Grid header: revalidation indicator + refresh button -->
        <div class="grid-header">
            {#if revalidating}
                <span class="revalidating-pill" aria-live="polite">
                    <span class="revalidating-dot"></span>
                    Refreshing
                </span>
            {:else}
                <span></span>
            {/if}
        </div>
        <div class="grid">
            {#each images as img, i}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="grid-card" onclick={() => openLightbox(i)}>
                    <div class="img-container">
                        <img src={img.content} alt={img.prompt || "Generated creation"} loading="lazy" />
                    </div>
                    <!-- Download Icon Overlay -->
                    <button
                        class="card-download-btn"
                        onclick={(e) => downloadImage(img.content, e)}
                        aria-label="Download image"
                    >
                        <svg viewBox="0 0 24 24"
                            ><path
                                d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"
                            /></svg
                        >
                    </button>
                    <div class="card-overlay">
                        <span class="minigame-tag">{img.minigameName || "Minigame"}</span>
                        {#if img.prompt}
                            <p class="prompt-preview">{img.prompt}</p>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Infinite Scroll Loading Indicator & Intersection Anchor -->
    <div bind:this={scrollAnchor} class="scroll-anchor-container">
        {#if loadingMore}
            <Spinner />
            <span class="loading-more-text">Loading more masterpieces...</span>
        {:else if !hasMore && images.length > 0}
            <p class="end-gallery-text">You've reached the end of the gallery. Keep creating! 🚀</p>
        {/if}
    </div>
</div>

<!-- Lightbox Modal -->
{#if activeIndex !== null && images[activeIndex]}
    {@const current = images[activeIndex]}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="lightbox" onclick={closeLightbox} role="dialog" aria-modal="true" tabindex="-1">
        <button class="close-btn" onclick={closeLightbox} aria-label="Close lightbox">
            <svg viewBox="0 0 24 24"
                ><path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                /></svg
            >
        </button>

        <button class="nav-btn prev-btn" onclick={prevImage} aria-label="Previous image">
            <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
        </button>

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div class="lightbox-content" onclick={(e) => e.stopPropagation()} role="document">
            <div class="lightbox-img-wrapper">
                <img src={current.content} alt={current.prompt || "Creation details"} />
            </div>
            <div class="lightbox-details">
                <div class="details-header">
                    <span class="game-tag">Game #{current.game}</span>
                    <span class="minigame-tag-large">{current.minigameName || "Minigame"}</span>
                    <div class="spacer"></div>
                    <!-- Lightbox Download Button -->
                    <button class="lightbox-download-btn" onclick={() => downloadImage(current.content)}>
                        <svg viewBox="0 0 24 24"
                            ><path
                                d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"
                            /></svg
                        >
                        <span>Download</span>
                    </button>
                </div>
                {#if current.prompt}
                    <p class="lightbox-prompt">"{current.prompt}"</p>
                {/if}
                <div class="details-footer">
                    <span class="date-text">{new Date(current.createdAt).toLocaleDateString()}</span>
                    {#if current.votes !== undefined && current.votes !== null}
                        <span class="votes-badge"
                            >⭐ {current.votes} {current.votes === 1 ? "vote" : "votes"}</span
                        >
                    {/if}
                </div>
            </div>
        </div>

        <button class="nav-btn next-btn" onclick={nextImage} aria-label="Next image">
            <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
        </button>
    </div>
{/if}

<style>
    .grid-wrapper {
        width: 100%;
        margin-top: 1rem;
    }

    .spinner-container,
    .error-container,
    .empty-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 1.5rem;
        text-align: center;
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 1.5rem;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
    }

    .loading-text {
        margin-top: 1rem;
        color: var(--m3c-on-surface-variant);
        font-size: 0.95rem;
        font-weight: 500;
    }

    .error-text {
        color: var(--m3c-error);
        font-size: 1rem;
        margin-bottom: 1rem;
    }

    .retry-btn {
        background: var(--m3c-primary);
        color: var(--m3c-on-primary);
        border: none;
        padding: 0.6rem 1.5rem;
        border-radius: 2rem;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .retry-btn:hover {
        transform: scale(1.05);
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 0.75rem;
    }

    .empty-text {
        color: var(--m3c-on-surface-variant);
        font-size: 1rem;
    }

    /* Grid header (revalidation indicator + refresh button) */
    .grid-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        min-height: 2rem;
    }

    .revalidating-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.55);
        background: rgba(255, 255, 255, 0.06);
        padding: 0.2rem 0.65rem 0.2rem 0.45rem;
        border-radius: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        letter-spacing: 0.03em;
        text-transform: uppercase;
    }

    .revalidating-dot {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: var(--m3c-primary, #80cbc4);
        animation: pulse-dot 1.2s ease-in-out infinite;
    }

    @keyframes pulse-dot {
        0%,
        100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.4;
            transform: scale(0.7);
        }
    }

    .refresh-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.6);
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        backdrop-filter: blur(5px);
        transition:
            background 0.2s,
            color 0.2s,
            transform 0.3s;
    }

    .refresh-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.14);
        color: #fff;
        transform: rotate(180deg);
    }

    .refresh-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .refresh-btn svg {
        width: 1rem;
        height: 1rem;
        fill: currentColor;
    }

    /* Responsive Grid styling */
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1rem;
        width: 100%;
    }

    @media (min-width: 480px) {
        .grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        }
    }

    .grid-card {
        position: relative;
        padding: 0;
        margin: 0;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.04);
        border-radius: 1.25rem;
        overflow: hidden;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        transition:
            transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
            box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
            border-color 0.2s;
        /* Native browser rendering optimization for performance */
        content-visibility: auto;
        contain-intrinsic-size: 200px;
    }

    .grid-card:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .img-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
        background: #111;
    }

    .img-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
    }

    .grid-card:hover .img-container img {
        transform: scale(1.08);
    }

    /* Card floating download button */
    .card-download-btn {
        position: absolute;
        top: 0.6rem;
        right: 0.6rem;
        background: rgba(0, 0, 0, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff;
        width: 2.3rem;
        height: 2.3rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        backdrop-filter: blur(5px);
        opacity: 0;
        transform: scale(0.85);
        transition:
            opacity 0.25s ease,
            transform 0.25s ease,
            background 0.2s;
        z-index: 5;
    }

    .grid-card:hover .card-download-btn {
        opacity: 1;
        transform: scale(1);
    }

    .card-download-btn:hover {
        background: rgba(0, 0, 0, 0.85);
        color: var(--m3c-primary);
        transform: scale(1.08);
    }

    .card-download-btn svg {
        width: 1.15rem;
        height: 1.15rem;
        fill: currentColor;
    }

    .card-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.9) 0%,
            rgba(0, 0, 0, 0.5) 60%,
            transparent 100%
        );
        padding: 1.5rem 0.75rem 0.75rem 0.75rem;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        opacity: 0.9;
        transition: opacity 0.2s;
    }

    .minigame-tag {
        font-size: 0.7rem;
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        padding: 0.15rem 0.5rem;
        border-radius: 1rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        backdrop-filter: blur(5px);
    }

    .prompt-preview {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.9);
        margin: 0.25rem 0 0 0;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        font-weight: 500;
    }

    /* Infinite Scroll indicators */
    .scroll-anchor-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2.5rem 0 1rem 0;
        gap: 0.75rem;
    }

    .loading-more-text {
        font-size: 0.85rem;
        color: var(--m3c-on-surface-variant);
        font-weight: 500;
    }

    .end-gallery-text {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.35);
        font-weight: 500;
        text-align: center;
    }

    /* Full-Screen Lightbox Modal styling */
    .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(10, 10, 10, 0.92);
        backdrop-filter: blur(25px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        box-sizing: border-box;
        animation: fadeIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .lightbox-content {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 2rem;
        overflow: hidden;
        max-width: 480px;
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes scaleUp {
        from {
            transform: scale(0.92);
        }
        to {
            transform: scale(1);
        }
    }

    .lightbox-img-wrapper {
        width: 100%;
        aspect-ratio: 1;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .lightbox-img-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .lightbox-details {
        padding: 1.5rem;
        background: linear-gradient(to bottom, rgba(20, 20, 20, 0.4), rgba(10, 10, 10, 0.8));
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .details-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
    }

    .spacer {
        flex-grow: 1;
    }

    .game-tag {
        font-size: 0.75rem;
        font-weight: bold;
        color: var(--m3c-primary);
        background: rgba(255, 255, 255, 0.05);
        padding: 0.25rem 0.6rem;
        border-radius: 0.5rem;
        text-transform: uppercase;
    }

    .minigame-tag-large {
        font-size: 0.75rem;
        font-weight: 800;
        color: #fff;
        background: rgba(255, 255, 255, 0.15);
        padding: 0.25rem 0.6rem;
        border-radius: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .lightbox-download-btn {
        background: var(--m3c-primary);
        color: var(--m3c-on-primary);
        border: none;
        padding: 0.4rem 0.9rem;
        border-radius: 1.5rem;
        font-size: 0.8rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        transition:
            transform 0.2s,
            background 0.2s;
    }

    .lightbox-download-btn:hover {
        transform: translateY(-1px);
        filter: brightness(1.1);
    }

    .lightbox-download-btn svg {
        width: 1rem;
        height: 1rem;
        fill: currentColor;
    }

    .lightbox-prompt {
        font-size: 1.05rem;
        color: #fff;
        margin: 0;
        font-style: italic;
        line-height: 1.4;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .details-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 0.75rem;
    }

    .date-text {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .votes-badge {
        font-size: 0.8rem;
        font-weight: bold;
        color: #ffd54f;
        background: rgba(255, 213, 79, 0.12);
        padding: 0.2rem 0.6rem;
        border-radius: 1rem;
    }

    /* Lightbox control buttons */
    .close-btn {
        position: absolute;
        top: 1.5rem;
        right: 1.5rem;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
        transition:
            background 0.2s,
            transform 0.2s;
        z-index: 1010;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
    }

    .nav-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
        transition:
            background 0.2s,
            transform 0.2s;
        z-index: 1010;
    }

    .nav-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-50%) scale(1.05);
    }

    .prev-btn {
        left: 1.5rem;
    }

    .next-btn {
        right: 1.5rem;
    }

    .close-btn svg,
    .nav-btn svg {
        width: 1.5rem;
        height: 1.5rem;
        fill: currentColor;
    }

    /* Hide nav buttons on narrow screens and let user click backdrop/close */
    @media (max-width: 600px) {
        .nav-btn {
            display: none;
        }
    }
</style>
