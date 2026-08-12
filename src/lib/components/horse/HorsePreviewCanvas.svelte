<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";
  import { HorseGenerator } from "./pcg/HorseGenerator";
  import { HorseAnimator } from "./pcg/HorseAnimator";
  import type { HorseAttributes, AnimationMode } from "./types";

  export let attributes: HorseAttributes;
  export let animationMode: AnimationMode = "idle";

  let containerEl: HTMLDivElement;
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let generator: HorseGenerator | null = null;
  let animator: HorseAnimator | null = null;
  let animationFrameId: number;
  let clock: THREE.Clock;

  // Camera Orbit Drag state (Mouse & Touch)
  let isDragging = false;
  let previousPosition = { x: 0, y: 0 };
  let cameraTarget = new THREE.Vector3(0, 1.8, 0);
  let cameraRadius = 6.2;
  let cameraTheta = Math.PI / 4; // Azimuth angle
  let cameraPhi = Math.PI / 6; // Elevation angle

  $: if (generator && attributes) {
    generator.updateAttributes(attributes);
  }

  let resizeObserver: ResizeObserver | null = null;

  onMount(() => {
    initThreeScene();
    window.addEventListener("resize", handleResize);
    if (containerEl) {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(containerEl);
    }
  });

  onDestroy(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", handleResize);
    if (resizeObserver) resizeObserver.disconnect();
    if (renderer) {
      renderer.dispose();
    }
  });

  function initThreeScene() {
    if (!containerEl) return;
    const width = containerEl.clientWidth;
    const height = containerEl.clientHeight;

    // Scene setup with transparent background
    scene = new THREE.Scene();
    scene.background = null;

    // Camera setup
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    updateCameraPosition();

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerEl.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    sunLight.position.set(6, 12, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x7099ff, 1.2);
    rimLight.position.set(-6, 8, -8);
    scene.add(rimLight);

    // Generator & Animator Init
    generator = new HorseGenerator();
    animator = new HorseAnimator(generator);
    generator.updateAttributes(attributes);
    scene.add(generator.containerGroup);

    clock = new THREE.Clock();

    // Start Animation Loop
    animate();
  }

  function updateCameraPosition() {
    if (!camera) return;

    // Clamp Phi (elevation) to prevent flipping under ground
    cameraPhi = Math.max(0.08, Math.min(Math.PI / 2.2, cameraPhi));

    const x =
      cameraTarget.x +
      cameraRadius * Math.sin(cameraPhi) * Math.sin(cameraTheta);
    const y = cameraTarget.y + cameraRadius * Math.cos(cameraPhi);
    const z =
      cameraTarget.z +
      cameraRadius * Math.sin(cameraPhi) * Math.cos(cameraTheta);

    camera.position.set(x, y, z);
    camera.lookAt(cameraTarget);
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (animator && generator) {
      animator.update(delta, animationMode, attributes);
    }

    updateCameraPosition();

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function handleResize() {
    if (!containerEl || !renderer || !camera) return;
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // Pointer & Touch Orbit Drag Events
  function onPointerDown(clientX: number, clientY: number) {
    isDragging = true;
    previousPosition = { x: clientX, y: clientY };
  }

  function onPointerMove(clientX: number, clientY: number) {
    if (!isDragging) return;
    const deltaX = clientX - previousPosition.x;
    const deltaY = clientY - previousPosition.y;

    cameraTheta -= deltaX * 0.008;
    cameraPhi -= deltaY * 0.008;

    previousPosition = { x: clientX, y: clientY };
  }

  function onPointerUp() {
    isDragging = false;
  }

  // Mouse handlers
  function onMouseDown(e: MouseEvent) {
    onPointerDown(e.clientX, e.clientY);
  }
  function onMouseMove(e: MouseEvent) {
    onPointerMove(e.clientX, e.clientY);
  }

  // Touch handlers for mobile fingers
  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  }
  function onTouchMove(e: TouchEvent) {
    if (e.touches.length === 1 && isDragging) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    cameraRadius += e.deltaY * 0.005;
    cameraRadius = Math.max(3.2, Math.min(12.0, cameraRadius));
  }
</script>

<div class="relative w-full h-full min-h-0 select-none touch-none">
  <!-- Clean 3D Canvas Viewport (Finger/Mouse Orbit Only, Zero Overlay Buttons) -->
  <div
    bind:this={containerEl}
    class="w-full h-full cursor-grab active:cursor-grabbing"
    on:mousedown={onMouseDown}
    on:mousemove={onMouseMove}
    on:mouseup={onPointerUp}
    on:mouseleave={onPointerUp}
    on:touchstart={onTouchStart}
    on:touchmove={onTouchMove}
    on:touchend={onPointerUp}
    on:wheel={onWheel}
    role="region"
    aria-label="3D Horse Interactive Viewport"
  ></div>
</div>
