<script lang="ts">
    import { onMount } from "svelte";

    export let color: string = "#333";
    export let background: string = "#fff";
    export let square: boolean = false;
    export let active: boolean = false;

    let canvas: HTMLCanvasElement;
    let context: CanvasRenderingContext2D | null = null;
    let isDrawing: boolean = false;
    let start: { x: number; y: number } = { x: 0, y: 0 };
    // internal buffer size (pixels)
    let bufferWidth: number = 320;
    let bufferHeight: number = 480;
    let containerElement: HTMLDivElement;

    let drawingBackup: string | null = null;

    const saveBackup = () => {
        if (canvas) {
            drawingBackup = canvas.toDataURL("image/png");
        }
    };

    /**
     * Initialize or resize the internal canvas buffer only when the computed
     * size actually changes. Changing canvas.width / canvas.height clears the
     * drawing buffer, so avoid doing it unnecessarily. The visible CSS size
     * is kept responsive (100% width) while the internal buffer is adjusted
     * only when the container's width changes.
     */
    const initCanvas = () => {
        if (!canvas || !containerElement) return;

        const rect = containerElement.getBoundingClientRect();
        const newBufferWidth = Math.max(1, Math.floor(rect.width));
        const newBufferHeight = square
            ? newBufferWidth
            : Math.max(1, Math.floor(newBufferWidth * 1.5));

        // If size hasn't changed and we have a context, just update stroke style
        if (
            context &&
            newBufferWidth === bufferWidth &&
            newBufferHeight === bufferHeight
        ) {
            context.strokeStyle = color;
            return;
        }

        // Update buffer dimensions only when they change
        bufferWidth = newBufferWidth;
        bufferHeight = newBufferHeight;

        // Set internal drawing buffer size (this clears the canvas)
        canvas.width = bufferWidth;
        canvas.height = bufferHeight;

        // Ensure the visible element scales to the container
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${square ? rect.width : Math.floor(rect.width * 1.5)}px`;

        context = canvas.getContext("2d");
        if (!context) return;

        // Set drawing defaults
        context.lineWidth = 6;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = color;
        context.fillStyle = background;

        // Fill background
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Restore backup if it exists
        if (drawingBackup) {
            const img = new Image();
            img.onload = () => {
                context?.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = drawingBackup;
        }
    };

    onMount(() => {
        initCanvas();
        // Second pass after layout settles (keeps behaviour similar to previous)
        setTimeout(initCanvas, 360);
    });

    // react to active prop changes
    $: if (active) {
        setTimeout(initCanvas, 100);
    }

    // react to color/background changes
    $: if (context) {
        context.strokeStyle = color;
        // If you want the "eraser" to use the current background, we respect that in handlers.
    }

    $: if (context && background) {
        // If background changes and buffer exists, refill the background
        // (do not clear strokes unless explicitly requested)
        // We won't automatically clear the user's drawing here; this just sets
        // the fill style for future clear operations.
        context.fillStyle = background;
    }

    // Convert client coordinates to canvas internal coordinates accounting for CSS scaling
    const getCanvasCoordinates = (clientX: number, clientY: number) => {
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    // Mouse handlers — use client coordinates for accurate mapping even when CSS scales
    const handlePointerStart = (e: MouseEvent | PointerEvent) => {
        if (!context || !canvas) return;
        const coords = getCanvasCoordinates(
            (e as MouseEvent).clientX,
            (e as MouseEvent).clientY,
        );

        if (color === background) {
            // Clear to background color
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = background;
            context.fillRect(0, 0, canvas.width, canvas.height);
            drawingBackup = null;
            isDrawing = false;
            return;
        }

        isDrawing = true;
        start = coords;
    };

    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
        if (!isDrawing || !context || !canvas) return;

        const coords = getCanvasCoordinates(
            (e as MouseEvent).clientX,
            (e as MouseEvent).clientY,
        );

        const { x, y } = start;
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(coords.x, coords.y);
        context.closePath();
        context.stroke();

        start = coords;
    };

    const handlePointerEnd = () => {
        if (isDrawing) {
            isDrawing = false;
            saveBackup();
        }
    };

    // Touch handlers (convert touch -> client coords)
    const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        if (!context || !canvas) return;
        const touch = e.touches[0];
        if (!touch) return;
        const coords = getCanvasCoordinates(touch.clientX, touch.clientY);

        if (color === background) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = background;
            context.fillRect(0, 0, canvas.width, canvas.height);
            drawingBackup = null;
            isDrawing = false;
            return;
        }

        isDrawing = true;
        start = coords;
    };

    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (!isDrawing || !context || !canvas) return;
        const touch = e.touches[0];
        if (!touch) return;
        const coords = getCanvasCoordinates(touch.clientX, touch.clientY);

        const { x, y } = start;
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(coords.x, coords.y);
        context.closePath();
        context.stroke();

        start = coords;
    };

    // Exported APIs for Svelte bindings
    export const clear = () => {
        if (!canvas || !context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawingBackup = null;
    };

    export const toDataURL = () => {
        return canvas ? canvas.toDataURL("image/png") : "";
    };
</script>

<svelte:window on:resize={initCanvas} />

<div bind:this={containerElement} class="canvas-container">
    <!--
    Do NOT bind `width`/`height` attributes on the element. We manage the internal
    buffer (`canvas.width` / `canvas.height`) imperatively in `initCanvas`.
    Use a CSS style for background and responsive sizing.
  -->
    <canvas
        id="draw-canvas"
        bind:this={canvas}
        style="background: {background}; width: 100%; height: auto;"
        on:mousedown={handlePointerStart}
        on:mouseup={handlePointerEnd}
        on:mouseleave={handlePointerEnd}
        on:mousemove={handlePointerMove}
        on:touchstart={handleTouchStart}
        on:touchmove={handleTouchMove}
        on:touchend={handlePointerEnd}
        on:touchcancel={handlePointerEnd}
    ></canvas>
</div>

<style>
    .canvas-container {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #draw-canvas {
        border-radius: 30px;
        user-select: none;
        touch-action: none;
        max-width: 100%;
        height: auto;
        display: block;
    }
</style>
