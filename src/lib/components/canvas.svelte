<script lang="ts">
  import { onMount } from "svelte";

  export let width: number = 240;
  export let height: number = 320;
  export let color: string = "#333";
  export let background: string = "#fff";
  export let square: boolean = false;

  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;
  let isDrawing: boolean = false;
  let start: { x: number; y: number };

  let t: number, l: number;

  onMount(() => {
    width = Math.min(window.innerWidth - 50, 500);
    height = square ? width : width * 1.3;
    context = canvas.getContext("2d")!;
    context.lineWidth = 1;

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    handleSize();
  });

  $: if (context) {
    context.strokeStyle = color;
  }

  const handleStart = ({ offsetX: x, offsetY: y }: any) => {
    if (color === background) {
      context.clearRect(0, 0, width, height);
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

  const handleSize = () => {
    console.log(window.scrollY);

    const { top, left } = canvas.getBoundingClientRect();
    t = top;
    l = left;
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    handleSize();
    const { clientX, clientY } = e.touches[0];
    handleStart({
      offsetX: clientX - l,
      offsetY: clientY - t,
    } as MouseEvent);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const { clientX, clientY } = e.touches[0];
    handleMove({
      offsetX: clientX - l,
      offsetY: clientY - t,
    } as MouseEvent);
  };
</script>

<svelte:window on:resize={handleSize} on:scroll={handleSize} />

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

<style>
  #draw-canvas {
    border-radius: 30px;
    user-select: none;
    touch-action: none;
  }
</style>
