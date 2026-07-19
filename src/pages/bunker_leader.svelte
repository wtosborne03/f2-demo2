<script lang="ts">
    import { get } from "svelte/store";
    import type { bunkerData } from "../types/page_data";
    import { gameClient, gameState } from "$lib/wsapi/gameClient";
    import Icon from "@iconify/svelte";
    import doubloonIcon from "$lib/assets/icons/doubloon.png";

    let m_data: bunkerData;
    m_data = get(gameState).page_data;

    let selected_location_id = "";
    let isArmed = false;
    let isLaunched = false;

    function selectLocation(id: string) {
        if (isLaunched) return;
        selected_location_id = id;
        isArmed = true;
    }

    function submit_prompt() {
        if (!selected_location_id || isLaunched) return;
        isLaunched = true;

        gameClient.sendInput({
            type: "bunkerSelect",
            answer: selected_location_id,
        });
    }

    function getTargetEmoji(type: string, icon: string): string {
        if (icon && !icon.includes(":")) return icon;
        const lower = (type || "").toLowerCase();
        if (lower.includes("hospital") || lower.includes("clinic") || lower.includes("medical")) return "🏥";
        if (lower.includes("museum") || lower.includes("gallery") || lower.includes("historic") || lower.includes("monument")) return "🏛️";
        if (lower.includes("library") || lower.includes("university") || lower.includes("school") || lower.includes("college")) return "📚";
        if (lower.includes("theater") || lower.includes("cinema") || lower.includes("arts") || lower.includes("music")) return "🎭";
        if (lower.includes("stadium") || lower.includes("arena") || lower.includes("sports") || lower.includes("gym")) return "🏟️";
        if (lower.includes("park") || lower.includes("forest") || lower.includes("nature") || lower.includes("garden") || lower.includes("leisure")) return "🌳";
        if (lower.includes("castle") || lower.includes("fort")) return "🏰";
        if (lower.includes("airport")) return "✈️";
        if (lower.includes("station") || lower.includes("subway") || lower.includes("bus")) return "🚂";
        if (lower.includes("shop") || lower.includes("mall") || lower.includes("market") || lower.includes("store")) return "🛍️";
        if (lower.includes("restaurant") || lower.includes("cafe") || lower.includes("food") || lower.includes("bar") || lower.includes("pub")) return "🍔";
        if (lower.includes("church") || lower.includes("mosque") || lower.includes("temple") || lower.includes("synagogue") || lower.includes("cathedral") || lower.includes("religious")) return "⛪";
        return "📍";
    }
</script>

<svelte:head>
    <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div class="launch-control">
    <!-- Header -->
    <header class="control-header">
        <div class="status-indicator" class:armed={isArmed}>
            <div class="status-light"></div>
            <span class="status-text"
                >{isArmed ? "TARGET LOCKED" : "AWAITING TARGET"}</span
            >
        </div>
        <h1 class="header-title">SELECT TARGET ZONE</h1>
    </header>

    <!-- Targets List -->
    <div class="targets-container">
        <div class="targets-list">
            {#if m_data?.locations}
                {#each m_data.locations as location}
                    <button
                        class="target-card"
                        class:selected={selected_location_id === location.id}
                        class:disabled={isLaunched}
                        on:click={() => selectLocation(location.id)}
                    >
                        <div class="target-content">
                            <div class="target-icon-wrapper">
                                <span class="target-emoji">{getTargetEmoji(location.type, location.icon)}</span>
                            </div>
                            <div class="target-info">
                                <span class="target-name">{location.name}</span>
                                {#if location.address}
                                    <span class="target-address"
                                        >{location.address}</span
                                    >
                                {/if}
                                <span class="target-type"
                                    >{location.type?.toUpperCase() ||
                                        "LOCATION"}</span
                                >
                            </div>
                            {#if location.points}
                                <div class="doubloon-badge">
                                    <img src={doubloonIcon} alt="doubloon" class="coin-icon" />
                                    <span class="points-val">+{location.points}</span>
                                </div>
                            {/if}
                            {#if selected_location_id === location.id}
                                <div class="selected-indicator">
                                    <Icon icon="mdi:target" />
                                </div>
                            {/if}
                        </div>
                    </button>
                {/each}
            {:else}
                <div class="no-targets">
                    <Icon icon="mdi:radar" class="radar-icon" />
                    <p>SCANNING FOR TARGETS...</p>
                </div>
            {/if}
        </div>
    </div>

    <!-- Launch Button -->
    <div class="launch-section">
        <button
            class="launch-button"
            class:armed={isArmed && !isLaunched}
            class:launched={isLaunched}
            disabled={!isArmed || isLaunched}
            on:click={submit_prompt}
        >
            <div class="button-core">
                {#if isLaunched}
                    <Icon icon="mdi:rocket-launch" class="launch-icon" />
                {:else if isArmed}
                    <Icon icon="mdi:nuke" class="launch-icon" />
                {:else}
                    <Icon icon="mdi:lock" class="launch-icon" />
                {/if}
            </div>
        </button>
    </div>
</div>

<style>
    .launch-control {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100dvh;
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

    .status-indicator.armed {
        background: rgba(255, 50, 50, 0.15);
        border-color: rgba(255, 50, 50, 0.5);
    }

    .status-light {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #666;
        box-shadow: 0 0 10px rgba(100, 100, 100, 0.5);
    }

    .status-indicator.armed .status-light {
        background: #ff3333;
        box-shadow: 0 0 15px rgba(255, 50, 50, 0.8);
    }

    .status-text {
        font-family: "Share Tech Mono", monospace;
        font-size: 1rem;
        letter-spacing: 0.1em;
        color: #888;
    }

    .status-indicator.armed .status-text {
        color: #ff5555;
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

    /* Targets Container - Scrollable */
    .targets-container {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 0 16px 16px;
        position: relative;
        z-index: 10;
        -webkit-overflow-scrolling: touch;
    }

    .targets-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 8px;
    }

    /* Target Card */
    .target-card {
        position: relative;
        background: linear-gradient(
            135deg,
            rgba(30, 30, 40, 0.9) 0%,
            rgba(20, 20, 30, 0.95) 100%
        );
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

    .target-card.selected {
        background: linear-gradient(
            135deg,
            rgba(255, 50, 50, 0.15) 0%,
            rgba(200, 30, 30, 0.1) 100%
        );
        border-color: rgba(255, 50, 50, 0.6);
    }

    .target-card.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    .target-content {
        display: flex;
        align-items: center;
        gap: 14px;
        position: relative;
        z-index: 1;
    }

    .target-icon-wrapper {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 10px;
        background: linear-gradient(
            135deg,
            rgba(255, 100, 100, 0.15) 0%,
            rgba(255, 50, 50, 0.05) 100%
        );
        border: 1px solid rgba(255, 100, 100, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .target-emoji {
        font-size: 1.8rem;
    }

    :global(.target-icon) {
        font-size: 1.4rem;
        color: #ff6666;
    }

    .target-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .target-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .target-address {
        font-size: 0.85rem;
        color: #aa8888;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: "Share Tech Mono", monospace;
    }

    .target-type {
        font-family: "Share Tech Mono", monospace;
        font-size: 0.75rem;
        letter-spacing: 0.15em;
        color: #888;
    }

    .selected-indicator {
        width: 28px;
        height: 28px;
        background: rgba(255, 50, 50, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.9rem;
        box-shadow: 0 0 15px rgba(255, 50, 50, 0.6);
        flex-shrink: 0;
    }

    /* No Targets State */
    .no-targets {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        gap: 16px;
        color: #666;
    }

    :global(.radar-icon) {
        font-size: 3rem;
        color: #ff5555;
    }

    .no-targets p {
        font-family: "Share Tech Mono", monospace;
        font-size: 0.8rem;
        letter-spacing: 0.15em;
    }

    /* Launch Section */
    .launch-section {
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        position: relative;
        z-index: 10;
        flex-shrink: 0;
        background: linear-gradient(
            0deg,
            rgba(10, 10, 15, 0.95) 0%,
            transparent 100%
        );
    }

    .launch-button {
        position: relative;
        width: 5rem;
        height: 5rem;
        border-radius: 50%;
        background: #1a1a1a;
        border: none;
        cursor: pointer;
        font-family: inherit;
    }

    .launch-button:disabled {
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

    .launch-button.armed .button-core {
        background: linear-gradient(135deg, #4a1515 0%, #2a0a0a 100%);
        box-shadow:
            inset 0 2px 10px rgba(0, 0, 0, 0.5),
            0 0 30px rgba(255, 50, 50, 0.4);
    }

    .launch-button.launched .button-core {
        background: linear-gradient(135deg, #1a4a1a 0%, #0a2a0a 100%);
    }

    :global(.launch-icon) {
        font-size: 2.2rem;
        color: #666;
    }

    .launch-button.armed :global(.launch-icon) {
        color: #ff5555;
    }

    .launch-button.launched :global(.launch-icon) {
        color: #55ff55;
    }

    /* Scrollbar */
    .targets-container::-webkit-scrollbar {
        width: 4px;
    }

    .targets-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 2px;
    }

    .targets-container::-webkit-scrollbar-thumb {
        background: rgba(255, 50, 50, 0.3);
        border-radius: 2px;
    }

    .targets-container::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 50, 50, 0.5);
    }

    .doubloon-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: linear-gradient(135deg, rgba(255, 170, 0, 0.2) 0%, rgba(255, 100, 0, 0.1) 100%);
        border: 1px solid rgba(255, 170, 0, 0.4);
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(255, 150, 0, 0.15);
        align-self: center;
        flex-shrink: 0;
        margin-left: auto;
    }
    .coin-icon {
        width: 1.25rem;
        height: 1.25rem;
        object-fit: contain;
        filter: drop-shadow(0 0 2px rgba(255, 170, 0, 0.5));
        animation: spin-slow 4s linear infinite;
        display: inline-block;
        vertical-align: middle;
    }
    .points-val {
        font-family: "Share Tech Mono", monospace;
        font-size: 0.9rem;
        font-weight: 700;
        color: #ffcc00;
        text-shadow: 0 0 5px rgba(255, 200, 0, 0.5);
    }
    @keyframes spin-slow {
        0% { transform: rotateY(0deg); }
        100% { transform: rotateY(360deg); }
    }
</style>
