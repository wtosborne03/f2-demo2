<script lang="ts">
    import { get } from "svelte/store";
    import type { bunkerData } from "../types/page_data";
    import { gameClient, gameState } from "$lib/wsapi/gameClient";
    import Icon from "@iconify/svelte";

    let m_data: bunkerData;
    m_data = get(gameState).page_data;

    let selected_location_id = "";
    let isReady = false;
    let isConfirmed = false;

    function selectLocation(id: string) {
        if (isConfirmed) return;
        selected_location_id = id;
        isReady = true;
    }

    function submit_prompt() {
        if (!selected_location_id || isConfirmed) return;
        isConfirmed = true;

        gameClient.sendInput({
            type: "bunkerSelect",
            answer: selected_location_id,
        });
    }

    function getShelterIcon(type: string): string {
        const iconMap: Record<string, string> = {
            bunker: "mdi:bunker",
            subway: "mdi:subway",
            basement: "mdi:home-floor-negative-1",
            cave: "mdi:terrain",
            underground: "mdi:tunnel",
            shelter: "mdi:shield-home",
            vault: "mdi:safe-square",
            default: "mdi:shield-home-outline",
        };
        return iconMap[type] || iconMap.default;
    }
</script>

<svelte:head>
    <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div class="shelter-control">
    <!-- Header -->
    <header class="control-header">
        <div class="status-indicator" class:ready={isReady}>
            <div class="status-light"></div>
            <span class="status-text">{isReady ? "SHELTER SELECTED" : "SELECT SHELTER"}</span>
        </div>
        <h1 class="header-title">CHOOSE YOUR SHELTER</h1>
    </header>

    <!-- Shelters List -->
    <div class="shelters-container">
        <div class="shelters-list">
            {#if m_data?.locations}
                {#each m_data.locations as location}
                    <button
                        class="shelter-card"
                        class:selected={selected_location_id === location.id}
                        class:disabled={isConfirmed}
                        on:click={() => selectLocation(location.id)}
                    >
                        <div class="shelter-content">
                            <div class="shelter-icon-wrapper">
                                {#if location.thumbnail}
                                    <img
                                        src={location.thumbnail}
                                        alt={location.name}
                                        class="shelter-thumbnail"
                                    />
                                {:else}
                                    <Icon
                                        icon={location.icon || getShelterIcon(location.type)}
                                        class="shelter-icon"
                                    />
                                {/if}
                            </div>
                            <div class="shelter-info">
                                <span class="shelter-name">{location.name}</span>
                                {#if location.address}
                                    <span class="shelter-address">{location.address}</span>
                                {/if}
                                <span class="shelter-type"
                                    >{location.type?.toUpperCase() || "SHELTER"}</span
                                >
                            </div>
                            {#if selected_location_id === location.id}
                                <div class="selected-indicator">
                                    <Icon icon="mdi:check-bold" />
                                </div>
                            {/if}
                        </div>
                    </button>
                {/each}
            {:else}
                <div class="no-shelters">
                    <Icon icon="mdi:map-search" class="search-icon" />
                    <p>LOCATING SHELTERS...</p>
                </div>
            {/if}
        </div>
    </div>

    <!-- Confirm Button -->
    <div class="confirm-section">
        <button
            class="confirm-button"
            class:ready={isReady && !isConfirmed}
            class:confirmed={isConfirmed}
            disabled={!isReady || isConfirmed}
            on:click={submit_prompt}
        >
            <div class="button-core">
                {#if isConfirmed}
                    <Icon icon="mdi:run-fast" class="confirm-icon" />
                {:else if isReady}
                    <Icon icon="mdi:shield-check" class="confirm-icon" />
                {:else}
                    <Icon icon="mdi:shield-off-outline" class="confirm-icon" />
                {/if}
            </div>
        </button>
    </div>
</div>

<style>
    .shelter-control {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100dvh;
        background: linear-gradient(135deg, #0a0f14 0%, #0f1a2e 50%, #0a1020 100%);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: "Orbitron", sans-serif;
        color: #e0e0e0;
        padding-top: 6.5rem;
    }

    /* Header */
    .control-header {
        padding: 9px;
        text-align: center;
        position: relative;
        z-index: 10;
        flex-shrink: 0;
    }

    .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        margin-bottom: 12px;
    }

    .status-indicator.ready {
        background: rgba(50, 200, 100, 0.15);
        border-color: rgba(50, 200, 100, 0.5);
    }

    .status-light {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #666;
        box-shadow: 0 0 10px rgba(100, 100, 100, 0.5);
    }

    .status-indicator.ready .status-light {
        background: #33cc66;
        box-shadow: 0 0 15px rgba(50, 200, 100, 0.8);
    }

    .status-text {
        font-family: "Share Tech Mono", monospace;
        font-size: 1rem;
        letter-spacing: 0.1em;
        color: #888;
    }

    .status-indicator.ready .status-text {
        color: #55dd77;
    }

    .header-title {
        font-size: 1.4rem;
        font-weight: 900;
        letter-spacing: 0.05em;
        background: linear-gradient(180deg, #ffffff 0%, #888888 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
    }

    /* Shelters Container - Scrollable */
    .shelters-container {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 0 16px 16px;
        position: relative;
        z-index: 10;
        -webkit-overflow-scrolling: touch;
    }

    .shelters-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 8px;
    }

    /* Shelter Card */
    .shelter-card {
        position: relative;
        background: linear-gradient(135deg, rgba(20, 30, 50, 0.9) 0%, rgba(15, 25, 40, 0.95) 100%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        overflow: hidden;
        text-align: left;
        width: 100%;
        font-family: inherit;
        color: inherit;
    }

    .shelter-card.selected {
        background: linear-gradient(135deg, rgba(50, 200, 100, 0.15) 0%, rgba(30, 150, 80, 0.1) 100%);
        border-color: rgba(50, 200, 100, 0.6);
    }

    .shelter-card.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    .shelter-content {
        display: flex;
        align-items: center;
        gap: 14px;
        position: relative;
        z-index: 1;
    }

    .shelter-icon-wrapper {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 10px;
        background: linear-gradient(135deg, rgba(50, 150, 255, 0.15) 0%, rgba(50, 100, 200, 0.05) 100%);
        border: 1px solid rgba(50, 150, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .shelter-thumbnail {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
    }

    :global(.shelter-icon) {
        font-size: 1.4rem;
        color: #55aaff;
    }

    .shelter-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .shelter-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .shelter-address {
        font-size: 0.85rem;
        color: #99aabb;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: "Share Tech Mono", monospace;
    }

    .shelter-type {
        font-family: "Share Tech Mono", monospace;
        font-size: 0.75rem;
        letter-spacing: 0.15em;
        color: #888;
    }

    .selected-indicator {
        width: 28px;
        height: 28px;
        background: rgba(50, 200, 100, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.9rem;
        box-shadow: 0 0 15px rgba(50, 200, 100, 0.6);
        flex-shrink: 0;
    }

    /* No Shelters State */
    .no-shelters {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        gap: 16px;
        color: #666;
    }

    :global(.search-icon) {
        font-size: 3rem;
        color: #55aaff;
    }

    .no-shelters p {
        font-family: "Share Tech Mono", monospace;
        font-size: 0.8rem;
        letter-spacing: 0.15em;
    }

    /* Confirm Section */
    .confirm-section {
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        position: relative;
        z-index: 10;
        flex-shrink: 0;
        background: linear-gradient(0deg, rgba(10, 15, 25, 0.95) 0%, transparent 100%);
    }

    .confirm-button {
        position: relative;
        width: 5rem;
        height: 5rem;
        border-radius: 50%;
        background: #1a1a1a;
        border: none;
        cursor: pointer;
        font-family: inherit;
    }

    .confirm-button:disabled {
        cursor: not-allowed;
    }

    .button-core {
        position: absolute;
        inset: 8px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
            inset 0 2px 10px rgba(0, 0, 0, 0.5),
            0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .confirm-button.ready .button-core {
        background: linear-gradient(135deg, #154a20 0%, #0a2a10 100%);
        box-shadow:
            inset 0 2px 10px rgba(0, 0, 0, 0.5),
            0 0 30px rgba(50, 200, 100, 0.4);
    }

    .confirm-button.confirmed .button-core {
        background: linear-gradient(135deg, #1a3a4a 0%, #0a1a2a 100%);
    }

    :global(.confirm-icon) {
        font-size: 2.2rem;
        color: #666;
    }

    .confirm-button.ready :global(.confirm-icon) {
        color: #55dd77;
    }

    .confirm-button.confirmed :global(.confirm-icon) {
        color: #55aaff;
    }

    /* Scrollbar */
    .shelters-container::-webkit-scrollbar {
        width: 4px;
    }

    .shelters-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 2px;
    }

    .shelters-container::-webkit-scrollbar-thumb {
        background: rgba(50, 150, 255, 0.3);
        border-radius: 2px;
    }

    .shelters-container::-webkit-scrollbar-thumb:hover {
        background: rgba(50, 150, 255, 0.5);
    }
</style>
