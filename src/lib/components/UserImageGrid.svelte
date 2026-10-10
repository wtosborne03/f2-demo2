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

    // Audio Player State
    let audioElement: HTMLAudioElement | null = null;
    let isPlaying = false;
    let currentTime = 0;
    let duration = 0;
    let isAudioLoading = false;

    function resetAudio() {
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
        isPlaying = false;
        currentTime = 0;
        duration = 0;
        isAudioLoading = false;
    }

    function toggleAudioPlay(e?: Event) {
        if (e) e.stopPropagation();
        if (!audioElement) return;

        if (isPlaying) {
            audioElement.pause();
            isPlaying = false;
        } else {
            isAudioLoading = true;
            audioElement
                .play()
                .then(() => {
                    isPlaying = true;
                    isAudioLoading = false;
                })
                .catch((err) => {
                    console.error("Audio playback error:", err);
                    isPlaying = false;
                    isAudioLoading = false;
                });
        }
    }

    function handleAudioTimeUpdate() {
        if (audioElement) {
            currentTime = audioElement.currentTime;
        }
    }

    function handleAudioLoadedMetadata() {
        if (audioElement) {
            duration = audioElement.duration || 0;
            isAudioLoading = false;
        }
    }

    function handleAudioEnded() {
        isPlaying = false;
        currentTime = 0;
        if (audioElement) {
            audioElement.currentTime = 0;
        }
    }

    function handleAudioSeek(e: Event) {
        const input = e.target as HTMLInputElement;
        const targetTime = parseFloat(input.value);
        currentTime = targetTime;
        if (audioElement) {
            audioElement.currentTime = targetTime;
        }
    }

    function formatTime(seconds: number): string {
        if (isNaN(seconds) || seconds < 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }

    // CORS-safe audio download trigger
    async function downloadAudio(url: string, title?: string, e?: Event) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const cleanTitle = title
                ? title.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 35)
                : "hitmakers_song";
            const ext = url.includes(".wav") ? ".wav" : ".mp3";
            const filename = `${cleanTitle}${ext}`;

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Failed to download audio natively, opening in new window instead:", err);
            window.open(url, "_blank");
        }
    }

    function openLightbox(index: number) {
        resetAudio();
        activeIndex = index;
        if (typeof document !== "undefined") {
            document.body.style.overflow = "hidden";
        }
    }

    function closeLightbox() {
        resetAudio();
        activeIndex = null;
        if (typeof document !== "undefined") {
            document.body.style.overflow = "";
        }
    }

    function prevImage(e: Event) {
        e.stopPropagation();
        resetAudio();
        if (activeIndex !== null && images.length > 0) {
            activeIndex = (activeIndex - 1 + images.length) % images.length;
        }
    }

    function nextImage(e: Event) {
        e.stopPropagation();
        resetAudio();
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
            resetAudio();
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
                    {#if img.audioUrl}
                        <div class="card-audio-pill" title="Includes Generated Song">
                            <span class="pill-music-icon">🎵</span>
                            <span class="pill-text">Song</span>
                        </div>
                    {/if}
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
                    <!-- Lightbox Download Buttons -->
                    <div class="lightbox-actions">
                        {#if current.audioUrl}
                            <button
                                class="lightbox-download-btn audio-download"
                                onclick={(e) => downloadAudio(current.audioUrl!, current.prompt, e)}
                                title="Download Song Audio"
                            >
                                <svg viewBox="0 0 24 24">
                                    <path
                                        d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                                    />
                                </svg>
                                <span>Song</span>
                            </button>
                        {/if}
                        <button
                            class="lightbox-download-btn"
                            onclick={() => downloadImage(current.content)}
                            title="Download Cover Art"
                        >
                            <svg viewBox="0 0 24 24"
                                ><path
                                    d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"
                                /></svg
                            >
                            <span>Artwork</span>
                        </button>
                    </div>
                </div>

                {#if current.prompt}
                    <p class="lightbox-prompt">"{current.prompt}"</p>
                {/if}

                <!-- Hitmakers Music Player -->
                {#if current.audioUrl}
                    <div class="audio-player-card">
                        <audio
                            bind:this={audioElement}
                            src={current.audioUrl}
                            onplay={() => (isPlaying = true)}
                            onpause={() => (isPlaying = false)}
                            ontimeupdate={handleAudioTimeUpdate}
                            onloadedmetadata={handleAudioLoadedMetadata}
                            onended={handleAudioEnded}
                            preload="metadata"
                        ></audio>

                        <div class="player-top-row">
                            <button
                                class="play-toggle-btn"
                                onclick={toggleAudioPlay}
                                aria-label={isPlaying ? "Pause track" : "Play track"}
                            >
                                {#if isAudioLoading}
                                    <div class="audio-spinner"></div>
                                {:else if isPlaying}
                                    <svg viewBox="0 0 24 24" class="play-icon">
                                        <rect x="6" y="5" width="4" height="14" rx="1.5" />
                                        <rect x="14" y="5" width="4" height="14" rx="1.5" />
                                    </svg>
                                {:else}
                                    <svg viewBox="0 0 24 24" class="play-icon">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                {/if}
                            </button>

                            <div class="player-meta-column">
                                <div class="player-title-row">
                                    <span class="track-badge">Hit Single</span>
                                    {#if isPlaying}
                                        <div class="equalizer-bars">
                                            <span class="eq-bar eq-1"></span>
                                            <span class="eq-bar eq-2"></span>
                                            <span class="eq-bar eq-3"></span>
                                            <span class="eq-bar eq-4"></span>
                                        </div>
                                    {/if}
                                </div>
                                <span class="player-track-name">{current.prompt || "Hitmakers Collaboration"}</span>
                            </div>
                        </div>

                        <div class="player-progress-row">
                            <span class="time-label">{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                class="progress-slider"
                                min="0"
                                max={duration || 100}
                                step="0.1"
                                value={currentTime}
                                oninput={handleAudioSeek}
                                aria-label="Audio scrubber"
                            />
                            <span class="time-label duration">{formatTime(duration)}</span>
                        </div>
                    </div>
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
        background: var(--b-white);
        border: var(--border-heavy);
        box-shadow: var(--shadow-md);
        border-radius: 0;
        color: var(--b-black);
    }

    .loading-text {
        margin-top: 1rem;
        color: var(--b-black);
        font-family: var(--font-display);
        font-size: 1rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .error-text {
        color: var(--b-red);
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: 1rem;
    }

    .retry-btn {
        background: var(--b-blue);
        color: var(--b-white);
        border: var(--border-thick);
        box-shadow: var(--shadow-sm);
        padding: 0.6rem 1.75rem;
        border-radius: 0;
        font-family: var(--font-headline);
        font-size: 0.95rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 800;
        cursor: pointer;
        transition: transform var(--speed), box-shadow var(--speed);
    }

    .retry-btn:hover {
        transform: translate(-2px, -2px);
        box-shadow: var(--shadow-md);
    }

    .retry-btn:active {
        transform: translate(1px, 1px);
        box-shadow: var(--shadow-xs);
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 0.75rem;
    }

    .empty-text {
        color: var(--b-black);
        font-family: var(--font-display);
        font-size: 1.05rem;
        font-weight: 600;
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
        gap: 0.5rem;
        font-size: 0.75rem;
        font-family: var(--font-mono);
        font-weight: 700;
        color: var(--b-black);
        background: var(--b-white);
        padding: 0.25rem 0.75rem;
        border-radius: 0;
        border: 2px solid var(--b-black);
        box-shadow: 2px 2px 0px var(--b-black);
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    .revalidating-dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 0;
        background: var(--b-red);
        animation: pulse-dot 1s ease-in-out infinite;
    }

    @keyframes pulse-dot {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.3;
        }
    }

    .refresh-btn {
        background: var(--b-white);
        border: 2px solid var(--b-black);
        box-shadow: 2px 2px 0px var(--b-black);
        color: var(--b-black);
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform var(--speed), background-color var(--speed);
    }

    .refresh-btn:hover:not(:disabled) {
        background: var(--b-yellow);
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0px var(--b-black);
    }

    .refresh-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .refresh-btn svg {
        width: 1.1rem;
        height: 1.1rem;
        fill: currentColor;
    }

    /* Responsive Grid styling */
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1.25rem;
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
        border: var(--border-heavy);
        background: var(--b-white);
        border-radius: 0;
        overflow: hidden;
        cursor: pointer;
        box-shadow: var(--shadow-sm);
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        transition:
            transform var(--speed),
            box-shadow var(--speed);
        content-visibility: auto;
        contain-intrinsic-size: 200px;
    }

    .grid-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: var(--shadow-md);
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
    }

    /* Card floating download button */
    .card-download-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: var(--b-yellow);
        border: 2px solid var(--b-black);
        box-shadow: 2px 2px 0px var(--b-black);
        color: var(--b-black);
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transform: scale(0.9);
        transition: opacity var(--speed), transform var(--speed);
        z-index: 5;
    }

    .grid-card:hover .card-download-btn {
        opacity: 1;
        transform: scale(1);
    }

    .card-download-btn:hover {
        background: #ffd733;
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0px var(--b-black);
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
        background: var(--b-black);
        border-top: 2px solid var(--b-black);
        padding: 0.5rem 0.6rem;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        opacity: 0.95;
    }

    .minigame-tag {
        font-family: var(--font-headline);
        font-size: 0.65rem;
        background: var(--b-yellow);
        color: var(--b-black);
        border: 1.5px solid var(--b-black);
        padding: 0.1rem 0.45rem;
        border-radius: 0;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .prompt-preview {
        font-family: var(--font-display);
        font-size: 0.75rem;
        color: #ffffff;
        margin: 0.2rem 0 0 0;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        font-weight: 600;
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
        font-family: var(--font-display);
        font-size: 0.88rem;
        color: var(--b-black);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .end-gallery-text {
        font-family: var(--font-display);
        font-size: 0.88rem;
        color: #555555;
        font-weight: 700;
        text-align: center;
    }

    /* Full-Screen Lightbox Modal styling */
    .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(18, 18, 18, 0.88);
        backdrop-filter: none;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        box-sizing: border-box;
    }

    .lightbox-content {
        background: var(--b-white);
        border: var(--border-heavy);
        box-shadow: var(--shadow-xl);
        border-radius: 0;
        overflow: hidden;
        max-width: 480px;
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
    }

    .lightbox-img-wrapper {
        width: 100%;
        aspect-ratio: 1;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-bottom: 3px solid var(--b-black);
    }

    .lightbox-img-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .lightbox-details {
        padding: 1.25rem;
        background: var(--b-canvas-light, #ECE6DA);
        color: var(--b-black);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .details-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        flex-wrap: wrap;
    }

    .spacer {
        flex-grow: 1;
    }

    .game-tag {
        font-family: var(--font-headline);
        font-size: 0.72rem;
        font-weight: 800;
        color: var(--b-white);
        background: var(--b-blue);
        border: 2px solid var(--b-black);
        padding: 0.2rem 0.55rem;
        border-radius: 0;
        text-transform: uppercase;
    }

    .minigame-tag-large {
        font-family: var(--font-headline);
        font-size: 0.72rem;
        font-weight: 800;
        color: var(--b-black);
        background: var(--b-yellow);
        border: 2px solid var(--b-black);
        padding: 0.2rem 0.55rem;
        border-radius: 0;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .lightbox-download-btn {
        background: var(--b-blue);
        color: var(--b-white);
        border: 2px solid var(--b-black);
        box-shadow: 3px 3px 0px var(--b-black);
        padding: 0.4rem 0.85rem;
        border-radius: 0;
        font-family: var(--font-headline);
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
        transition: transform var(--speed), box-shadow var(--speed);
    }

    .lightbox-download-btn:hover {
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0px var(--b-black);
        background: #0d349e;
    }

    .lightbox-download-btn svg {
        width: 1rem;
        height: 1rem;
        fill: currentColor;
    }

    .lightbox-prompt {
        font-family: var(--font-display);
        font-size: 1.05rem;
        color: var(--b-black);
        margin: 0;
        font-weight: 700;
        line-height: 1.35;
    }

    .details-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.35rem;
        border-top: 2px solid var(--b-black);
        padding-top: 0.65rem;
    }

    .date-text {
        font-family: var(--font-mono);
        font-size: 0.8rem;
        font-weight: 700;
        color: #444444;
    }

    .votes-badge {
        font-family: var(--font-mono);
        font-size: 0.8rem;
        font-weight: 800;
        color: var(--b-black);
        background: var(--b-yellow);
        border: 2px solid var(--b-black);
        box-shadow: 2px 2px 0px var(--b-black);
        padding: 0.2rem 0.55rem;
        border-radius: 0;
    }

    /* Lightbox control buttons */
    .close-btn {
        position: absolute;
        top: 1.5rem;
        right: 1.5rem;
        background: var(--b-white);
        border: 3px solid var(--b-black);
        box-shadow: 4px 4px 0px var(--b-black);
        color: var(--b-black);
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--speed), box-shadow var(--speed), background-color var(--speed);
        z-index: 1010;
    }

    .close-btn:hover {
        background: var(--b-yellow);
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0px var(--b-black);
    }

    .nav-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: var(--b-white);
        border: 3px solid var(--b-black);
        box-shadow: 4px 4px 0px var(--b-black);
        color: var(--b-black);
        width: 3rem;
        height: 3rem;
        border-radius: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--speed), box-shadow var(--speed), background-color var(--speed);
        z-index: 1010;
    }

    .nav-btn:hover {
        background: var(--b-yellow);
        transform: translateY(-50%) translate(-2px, -2px);
        box-shadow: 6px 6px 0px var(--b-black);
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

    @media (max-width: 600px) {
        .nav-btn {
            display: none;
        }
    }

    /* Card Audio Pill Badge */
    .card-audio-pill {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        background: var(--b-red);
        border: 2px solid var(--b-black);
        box-shadow: 2px 2px 0px var(--b-black);
        color: var(--b-white);
        padding: 0.15rem 0.5rem;
        border-radius: 0;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        z-index: 5;
        pointer-events: none;
    }

    .pill-music-icon {
        font-size: 0.7rem;
    }

    .pill-text {
        font-family: var(--font-headline);
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Lightbox Actions & Music Player */
    .lightbox-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .lightbox-download-btn.audio-download {
        background: var(--b-red);
        box-shadow: 3px 3px 0px var(--b-black);
    }

    .lightbox-download-btn.audio-download:hover {
        background: #b51a1a;
    }

    .audio-player-card {
        background: var(--b-white);
        border: 3px solid var(--b-black);
        box-shadow: 4px 4px 0px var(--b-black);
        border-radius: 0;
        padding: 0.85rem 1rem;
        margin: 0.35rem 0;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
    }

    .player-top-row {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        width: 100%;
    }

    .play-toggle-btn {
        width: 2.6rem;
        height: 2.6rem;
        min-width: 2.6rem;
        border-radius: 0;
        background: var(--b-red);
        border: 2px solid var(--b-black);
        box-shadow: 2px 2px 0px var(--b-black);
        color: var(--b-white);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform var(--speed), box-shadow var(--speed), background-color var(--speed);
    }

    .play-toggle-btn:hover {
        background: #b51a1a;
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0px var(--b-black);
    }

    .play-icon {
        width: 1.25rem;
        height: 1.25rem;
        fill: currentColor;
    }

    .audio-spinner {
        width: 1.1rem;
        height: 1.1rem;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .player-meta-column {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        flex-grow: 1;
        min-width: 0;
    }

    .player-title-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .track-badge {
        font-family: var(--font-mono);
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: var(--b-yellow);
        color: var(--b-black);
        border: 1.5px solid var(--b-black);
        padding: 0.1rem 0.45rem;
        border-radius: 0;
    }

    .equalizer-bars {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 14px;
    }

    .eq-bar {
        width: 3px;
        background: var(--b-red);
        border-radius: 0;
        animation: eq-bounce 1s ease-in-out infinite alternate;
    }

    .eq-1 {
        animation-delay: 0s;
        height: 6px;
    }
    .eq-2 {
        animation-delay: 0.2s;
        height: 12px;
    }
    .eq-3 {
        animation-delay: 0.4s;
        height: 14px;
    }
    .eq-4 {
        animation-delay: 0.1s;
        height: 8px;
    }

    @keyframes eq-bounce {
        0% {
            height: 3px;
        }
        100% {
            height: 14px;
        }
    }

    .player-track-name {
        font-family: var(--font-display);
        font-size: 0.82rem;
        color: var(--b-black);
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .player-progress-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        width: 100%;
    }

    .time-label {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--b-black);
        font-variant-numeric: tabular-nums;
        min-width: 2.2rem;
    }

    .time-label.duration {
        text-align: right;
    }

    .progress-slider {
        flex-grow: 1;
        height: 6px;
        accent-color: var(--b-red);
        cursor: pointer;
        border-radius: 0;
        background: #cccccc;
    }
</style>
