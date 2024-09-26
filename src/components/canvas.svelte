<script>
  import { onMount } from "svelte";

  export let width = 240;
  export let height = 320;
  export let color = "#333";
  export let background = "#fff";

  let canvas;
  let context;
  let isDrawing;
  let start;

  let t, l;

  onMount(() => {
    context = canvas.getContext("2d");
    context.lineWidth = 3;

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    handleSize();
  });

  $: if (context) {
    context.strokeStyle = color;
  }

  const handleStart = ({ offsetX: x, offsetY: y }) => {
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

  const handleMove = ({ offsetX: x1, offsetY: y1 }) => {
    if (!isDrawing) return;

    const { x, y } = start;
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

  const handleTouchStart = (e) => {
    e.preventDefault();
    handleSize();
    const { clientX, clientY } = e.touches[0];
    handleStart({
      offsetX: clientX - l,
      offsetY: clientY - t,
    });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const { clientX, clientY } = e.touches[0];
    handleMove({
      offsetX: clientX - l,
      offsetY: clientY - t,
    });
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
    border-radius: 10px;
    user-select: none;
    touch-action: none;
  }
</style>
