<script lang="ts">
  import { onMount } from "svelte";
  import * as planck from "planck-js";

  let world: planck.World;
  let ground: planck.Body;
  let box: planck.Body;
  let renderer: HTMLDivElement;
  let isDragging = false;
  let dragOffset: planck.Vec2;

  onMount(() => {
    // Create a world
    world = new planck.World();

    // Create a ground
    ground = world.createBody();
    ground.createFixture(planck.Box(40, 1), {
      friction: 0.3,
      restitution: 0.5,
    });
    ground.setPosition(planck.Vec2(0, 60));

    // Create a box
    box = world.createDynamicBody(planck.Vec2(0, 0));
    box.createFixture(planck.Box(1, 1), {
      density: 1.0,
      friction: 0.3,
      restitution: 0.5,
    });

    // Apply a force to the box to fling it
    box.applyForceToCenter(planck.Vec2(100, -100), true);

    // Set up the renderer
    renderer = document.createElement("div");
    renderer.style.position = "absolute";
    renderer.style.top = "0";
    renderer.style.left = "0";
    renderer.style.width = "100%";
    renderer.style.height = "100%";
    document.body.appendChild(renderer);

    // Start the simulation loop
    const timeStep = 1 / 60;
    const velocityIterations = 6;
    const positionIterations = 2;

    function step() {
      world.step(timeStep, velocityIterations, positionIterations);

      // Update the box position
      const position = box.getPosition();
      renderer.style.transform = `translate(${position.x * 10}px, ${position.y * 10}px)`;

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);

    // Handle mouse events for dragging
    renderer.addEventListener("mousedown", (event) => {
      const mousePosition = planck.Vec2(event.clientX / 10, event.clientY / 10);
      const boxPosition = box.getPosition();
      const distance = mousePosition.sub(boxPosition).length();

      if (distance < 1) {
        isDragging = true;
        dragOffset = mousePosition.sub(boxPosition);
      }
    });

    renderer.addEventListener("mousemove", (event) => {
      if (isDragging) {
        const mousePosition = planck.Vec2(
          event.clientX / 10,
          event.clientY / 10,
        );
        const newPosition = mousePosition.sub(dragOffset);
        box.setPosition(newPosition);
      }
    });

    renderer.addEventListener("mouseup", () => {
      isDragging = false;
    });
  });
</script>

<div bind:this={renderer} class="w-20 h-20 bg-blue-500"></div>

<style>
  body {
    margin: 0;
    overflow: hidden;
  }
</style>
