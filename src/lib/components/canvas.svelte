<script lang="ts">
    export let color: string = "#333";
    export let background: string = "#fff";
    export let square: boolean = false;
    export let aspectRatio: "2/3" | "3/4" = "2/3";
    export let active: boolean = false;

    export interface Point {
        x: number;
        y: number;
    }

    export interface Stroke {
        color: string;
        width: number;
        points: Point[];
    }

    let strokes: Stroke[] = [];
    let currentStroke: Stroke | null = null;
    let isDrawing: boolean = false;
    let svgElement: SVGSVGElement;
    let containerElement: HTMLDivElement;

    $: viewBoxWidth = 400;
    $: viewBoxHeight = square ? 400 : aspectRatio === "3/4" ? 533 : 600;

    const MIN_DIST_SQ = 4; // 2px minimum movement squared

    const getCoordinates = (clientX: number, clientY: number): Point => {
        if (!svgElement) return { x: 0, y: 0 };
        try {
            const ctm = svgElement.getScreenCTM();
            if (ctm) {
                const pt = svgElement.createSVGPoint();
                pt.x = clientX;
                pt.y = clientY;
                const svgPt = pt.matrixTransform(ctm.inverse());
                return {
                    x: Math.round(svgPt.x * 10) / 10,
                    y: Math.round(svgPt.y * 10) / 10,
                };
            }
        } catch (e) {}

        const rect = svgElement.getBoundingClientRect();
        const x =
            Math.round(
                ((clientX - rect.left) / rect.width) * viewBoxWidth * 10,
            ) / 10;
        const y =
            Math.round(
                ((clientY - rect.top) / rect.height) * viewBoxHeight * 10,
            ) / 10;
        return { x, y };
    };

    // Ramer-Douglas-Peucker simplification algorithm
    const simplifyPoints = (pts: Point[], tolerance = 0.8): Point[] => {
        if (pts.length <= 2) return pts;
        let maxDist = 0;
        let idx = 0;
        const end = pts.length - 1;

        for (let i = 1; i < end; i++) {
            const dx = pts[end].x - pts[0].x;
            const dy = pts[end].y - pts[0].y;
            const norm = Math.hypot(dx, dy);
            const dist =
                norm === 0
                    ? Math.hypot(pts[i].x - pts[0].x, pts[i].y - pts[0].y)
                    : Math.abs(
                          dy * pts[i].x -
                              dx * pts[i].y +
                              pts[end].x * pts[0].y -
                              pts[end].y * pts[0].x,
                      ) / norm;

            if (dist > maxDist) {
                maxDist = dist;
                idx = i;
            }
        }

        if (maxDist > tolerance) {
            const left = simplifyPoints(pts.slice(0, idx + 1), tolerance);
            const right = simplifyPoints(pts.slice(idx), tolerance);
            return [...left.slice(0, -1), ...right];
        }
        return [pts[0], pts[end]];
    };

    const addPointIfFarEnough = (coords: Point) => {
        if (!currentStroke) return;
        const last = currentStroke.points[currentStroke.points.length - 1];
        if (last) {
            const dx = coords.x - last.x;
            const dy = coords.y - last.y;
            if (dx * dx + dy * dy < MIN_DIST_SQ) return;
        }
        currentStroke.points.push(coords);
        strokes = strokes;
    };

    const handlePointerStart = (e: MouseEvent | PointerEvent) => {
        const coords = getCoordinates(
            (e as MouseEvent).clientX,
            (e as MouseEvent).clientY,
        );

        if (color === background) {
            clear();
            isDrawing = false;
            return;
        }

        isDrawing = true;
        currentStroke = { color, width: 6, points: [coords] };
        strokes = [...strokes, currentStroke];
    };

    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
        if (!isDrawing || !currentStroke) return;
        addPointIfFarEnough(
            getCoordinates(
                (e as MouseEvent).clientX,
                (e as MouseEvent).clientY,
            ),
        );
    };

    const handlePointerEnd = () => {
        if (currentStroke && currentStroke.points.length > 2) {
            currentStroke.points = simplifyPoints(currentStroke.points);
            strokes = strokes;
        }
        isDrawing = false;
        currentStroke = null;
    };

    const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;
        const coords = getCoordinates(touch.clientX, touch.clientY);

        if (color === background) {
            clear();
            isDrawing = false;
            return;
        }

        isDrawing = true;
        currentStroke = { color, width: 6, points: [coords] };
        strokes = [...strokes, currentStroke];
    };

    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (!isDrawing || !currentStroke) return;
        const touch = e.touches[0];
        if (!touch) return;
        addPointIfFarEnough(getCoordinates(touch.clientX, touch.clientY));
    };

    export const clear = () => {
        strokes = [];
        currentStroke = null;
        isDrawing = false;
    };

    export const undo = () => {
        if (strokes.length > 0) strokes = strokes.slice(0, -1);
    };

    const getStrokePath = (s: Stroke): string => {
        if (s.points.length === 0) return "";
        if (s.points.length === 1) {
            const p = s.points[0];
            return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y}`;
        }
        return "M " + s.points.map((p) => `${p.x} ${p.y}`).join(" L ");
    };

    export const toSVG = (): string => {
        const vWidth = viewBoxWidth;
        const vHeight = viewBoxHeight;
        const pathsXml = strokes
            .map(
                (s) =>
                    `<path d="${getStrokePath(s)}" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
            )
            .join("");

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vWidth} ${vHeight}" width="${vWidth}" height="${vHeight}"><rect width="100%" height="100%" fill="${background}"/>${pathsXml}</svg>`;
    };

    export const toDataURL = (type = "image/svg+xml", quality = 0.8) => {
        const svgStr = toSVG();
        if (type.includes("svg")) {
            const base64Str = window.btoa(unescape(encodeURIComponent(svgStr)));
            return `data:image/svg+xml;base64,${base64Str}`;
        }

        // Raster fallback for image/png or image/webp
        const vWidth = viewBoxWidth;
        const vHeight = viewBoxHeight;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = vWidth;
        tempCanvas.height = vHeight;
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) return "";
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, vWidth, vHeight);
        strokes.forEach((s) => {
            if (s.points.length === 0) return;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(s.points[0].x, s.points[0].y);
            for (let i = 1; i < s.points.length; i++) {
                ctx.lineTo(s.points[i].x, s.points[i].y);
            }
            if (s.points.length === 1) {
                ctx.lineTo(s.points[0].x + 0.1, s.points[0].y);
            }
            ctx.stroke();
        });
        return tempCanvas.toDataURL(type, quality);
    };
</script>

<div bind:this={containerElement} class="canvas-container">
    <svg
        id="draw-canvas"
        bind:this={svgElement}
        viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"
        style="background: {background};"
        on:mousedown={handlePointerStart}
        on:mousemove={handlePointerMove}
        on:mouseup={handlePointerEnd}
        on:mouseleave={handlePointerEnd}
        on:touchstart={handleTouchStart}
        on:touchmove={handleTouchMove}
        on:touchend={handlePointerEnd}
        on:touchcancel={handlePointerEnd}
    >
        <rect width="100%" height="100%" fill={background} />
        {#each strokes as s}
            <path
                d={getStrokePath(s)}
                stroke={s.color}
                stroke-width={s.width}
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
            />
        {/each}
    </svg>
</div>

<style>
    .canvas-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #draw-canvas {
        user-select: none;
        touch-action: none;
        width: 100%;
        height: 100%;
        display: block;
    }
</style>
