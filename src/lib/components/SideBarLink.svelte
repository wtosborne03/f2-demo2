<script lang="ts">
    import { Icon } from "m3-svelte";

    interface Props {
        label: string;
        icon: any;
        active?: boolean;
        onclick?: () => void;
        color?: string; // e.g. "amber", "emerald", "purple", "rose", "#ff00ab", etc.
    }

    let {
        label,
        icon,
        active = false,
        onclick,
        color = "amber"
    }: Props = $props();

    // Map color prefix to active, inactive, and hover Tailwind classes
    const colorMap: Record<string, { active: string; inactive: string; hover: string }> = {
        amber: { active: "bg-amber-600", inactive: "bg-amber-600/50", hover: "hover:bg-amber-400" },
        emerald: { active: "bg-emerald-600", inactive: "bg-emerald-600/50", hover: "hover:bg-emerald-400" },
        rose: { active: "bg-rose-600", inactive: "bg-rose-600/50", hover: "hover:bg-rose-400" },
        blue: { active: "bg-blue-600", inactive: "bg-blue-600/50", hover: "hover:bg-blue-400" },
        purple: { active: "bg-purple-600", inactive: "bg-purple-600/50", hover: "hover:bg-purple-400" },
        red: { active: "bg-red-600", inactive: "bg-red-600/50", hover: "hover:bg-red-400" },
        orange: { active: "bg-orange-600", inactive: "bg-orange-600/50", hover: "hover:bg-orange-400" },
        sky: { active: "bg-sky-600", inactive: "bg-sky-600/50", hover: "hover:bg-sky-400" },
        violet: { active: "bg-violet-600", inactive: "bg-violet-600/50", hover: "hover:bg-violet-400" },
        indigo: { active: "bg-indigo-600", inactive: "bg-indigo-600/50", hover: "hover:bg-indigo-400" },
        fuchsia: { active: "bg-fuchsia-600", inactive: "bg-fuchsia-600/50", hover: "hover:bg-fuchsia-400" },
        teal: { active: "bg-teal-600", inactive: "bg-teal-600/50", hover: "hover:bg-teal-400" },
        cyan: { active: "bg-cyan-600", inactive: "bg-cyan-600/50", hover: "hover:bg-cyan-400" },
        lime: { active: "bg-lime-600", inactive: "bg-lime-600/50", hover: "hover:bg-lime-400" },
        gray: { active: "bg-gray-600", inactive: "bg-gray-600/50", hover: "hover:bg-gray-400" }
    };

    const preset = $derived(colorMap[color]);
    
    // If it's a preset, use the preset class names. If not, set custom CSS variable.
    const customStyle = $derived(!preset ? `--custom-color: ${color};` : undefined);
</script>

{#if preset}
    <div
        class="py-4 px-8 flex justify-between items-center rounded-bl-2xl rounded-tl-2xl ml-2 transition-colors duration-200 cursor-pointer {active ? preset.active : preset.inactive} {preset.hover}"
        {onclick}
        onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onclick?.();
            }
        }}
        role="link"
        tabindex="0"
    >
        <span>{label}</span>
        <Icon size={22} {icon} />
    </div>
{:else}
    <div
        class="py-4 px-8 flex justify-between items-center rounded-bl-2xl rounded-tl-2xl ml-2 transition-colors duration-200 cursor-pointer custom-link"
        class:active
        style={customStyle}
        {onclick}
        onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onclick?.();
            }
        }}
        role="link"
        tabindex="0"
    >
        <span>{label}</span>
        <Icon size={22} {icon} />
    </div>
{/if}

<style>
    .custom-link {
        background-color: color-mix(in srgb, var(--custom-color) 50%, transparent);
        color: white;
    }
    .custom-link.active {
        background-color: var(--custom-color);
    }
    .custom-link:hover {
        background-color: color-mix(in srgb, var(--custom-color) 80%, white);
    }
</style>
