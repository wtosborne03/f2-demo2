<script lang="ts">
  import { onMount } from "svelte";

  export let color: string = "#333";
  export let background: string = "#fff";
  export let square: boolean = false;

  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;
  let isDrawing: boolean = false;
  let start: { x: number; y: number };
  let width: number = 320;
  let height: number = 480;
  let containerElement: HTMLDivElement;

  const initCanvas = () => {
    if (!canvas || !containerElement) return;
    
    const container = containerElement.getBoundingClientRect();
    width = Math.floor(container.width);
    height = square ? width : Math.floor(width * 1.5);
    
    context = canvas.getContext("2d")!;
    context.lineWidth = 6;
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
  };

  onMount(() => {
    initCanvas();
  });

  $: if (context) {
    context.strokeStyle = color;
  }

  // Convert client coordinates to canvas coordinates accounting for CSS scaling
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = ({ offsetX: x, offsetY: y }: any) => {
    if (color === background) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      isDrawing = true;
      start = { x, y };
    }
  };

  const handleEnd = () => {
    isDrawing = false;
  };

  const handleMove = ({ offsetX: x1, offsetY: y1 }: any) => {
    if (!isDrawing) return;

    const { x, y } = start;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x1, y1);
    context.closePath();
    context.stroke();

    start = { x: x1, y: y1 };
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const { clientX, clientY } = e.touches[0];
    const coords = getCanvasCoordinates(clientX, clientY);
    
    if (color === background) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      isDrawing = true;
      start = coords;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const { clientX, clientY } = e.touches[0];
    const coords = getCanvasCoordinates(clientX, clientY);
    
    const { x, y } = start;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(coords.x, coords.y);
    context.closePath();
    context.stroke();

    start = coords;
  };
</script>

<svelte:window on:resize={initCanvas} />

<div bind:this={containerElement} class="canvas-container">
  <canvas
    id="draw-canvas"
    {width}
    {height}
    style:background
    bind:this={canvas}
    on:mousedown={handleStart}
    on:touchstart={handleTouchStart}
    on:mouseup={handleEnd}
    on:touchend={handleEnd}
    on:mouseleave={handleEnd}
    on:mousemove={handleMove}
    on:touchmove={handleTouchMove}
  />
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
