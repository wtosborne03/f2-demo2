<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";
  import { HorseGenerator } from "./pcg/HorseGenerator";
  import { HorseAnimator } from "./pcg/HorseAnimator";
  import type { HorseAttributes, AnimationMode } from "./types";

  export let attributes: HorseAttributes;
  export let animationMode: AnimationMode = "idle";

  let containerEl: HTMLDivElement | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let generator: HorseGenerator | null = null;
  let animator: HorseAnimator | null = null;
  let animationFrameId: number = 0;
  let clock: THREE.Clock | null = null;
  let resizeObserver: ResizeObserver | null = null;

  // WebGL health & device state
  let isContextLost = false;
  let webglError: string | null = null;
  let isMobile = false;
  let isPaused = false;

  // Camera Orbit Drag state (Mouse & Touch)
  let isDragging = false;
  let previousPosition = { x: 0, y: 0 };
  let cameraTarget = new THREE.Vector3(0, 1.8, 0);
  let cameraRadius = 6.2;
  let cameraTheta = Math.PI / 4; // Azimuth angle
  let cameraPhi = Math.PI / 6; // Elevation angle

  $: if (generator && attributes && !isContextLost) {
    try {
      generator.updateAttributes(attributes);
    } catch (e) {
      console.warn("Error updating horse attributes:", e);
    }
  }

  onMount(() => {
    isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      (window.matchMedia && window.matchMedia("(max-width: 768px)").matches);

    initThreeScene();

    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (containerEl) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerEl);
    }
  });

  onDestroy(() => {
    window.removeEventListener("resize", handleResize);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    cleanupThreeScene();
  });

  function handleVisibilityChange() {
    if (document.hidden) {
      isPaused = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    } else {
      if (isPaused && renderer && !isContextLost) {
        isPaused = false;
        clock?.getDelta();
        animate();
      }
    }
  }

  function handleContextLost(event: Event) {
    event.preventDefault();
    isContextLost = true;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }
    console.warn("HorsePreviewCanvas: WebGL Context lost. Waiting for restore...");
  }

  function handleContextRestored() {
    console.log("HorsePreviewCanvas: WebGL Context restored. Reinitializing scene...");
    isContextLost = false;
    webglError = null;
    cleanupThreeScene();
    initThreeScene();
  }

  function cleanupThreeScene() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }

    if (generator) {
      try {
        generator.dispose();
      } catch (e) {
        console.warn("Error disposing generator:", e);
      }
      generator = null;
    }
    animator = null;

    if (scene) {
      try {
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach((m) => m?.dispose());
              } else {
                obj.material.dispose();
              }
            }
          }
        });
        scene.clear();
      } catch (e) {
        console.warn("Error clearing scene:", e);
      }
      scene = null;
    }

    if (renderer) {
      const domEl = renderer.domElement;
      if (domEl) {
        domEl.removeEventListener("webglcontextlost", handleContextLost);
        domEl.removeEventListener("webglcontextrestored", handleContextRestored);
        if (domEl.parentNode) {
          domEl.parentNode.removeChild(domEl);
        }
      }

      try {
        renderer.dispose();
        // Explicitly force context loss to immediately release context back to browser
        renderer.forceContextLoss();
      } catch (e) {
        console.warn("Error disposing renderer:", e);
      }
      renderer = null;
    }
  }

  export function retryInit() {
    webglError = null;
    isContextLost = false;
    cleanupThreeScene();
    initThreeScene();
  }

  function initThreeScene() {
    if (!containerEl) return;
    const width = containerEl.clientWidth;
    const height = containerEl.clientHeight;

    if (width === 0 || height === 0) {
      // Container not laid out yet; ResizeObserver will trigger initialization
      return;
    }

    try {
      cleanupThreeScene();

      // Scene setup with transparent background
      scene = new THREE.Scene();
      scene.background = null;

      // Camera setup
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      updateCameraPosition();

      // Renderer setup with mobile-resilient configuration
      const maxPixelRatio = isMobile ? 1.5 : 2.0;
      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: true,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
        precision: isMobile ? "mediump" : "highp",
        depth: true,
        stencil: false,
      });

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = isMobile
        ? THREE.BasicShadowMap
        : THREE.PCFSoftShadowMap;

      const domEl = renderer.domElement;
      domEl.addEventListener("webglcontextlost", handleContextLost, false);
      domEl.addEventListener("webglcontextrestored", handleContextRestored, false);

      containerEl.appendChild(domEl);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
      sunLight.position.set(6, 12, 8);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = isMobile ? 512 : 1024;
      sunLight.shadow.mapSize.height = isMobile ? 512 : 1024;
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
      webglError = null;
      isContextLost = false;
      isPaused = false;

      // Start Animation Loop
      animate();
    } catch (err: any) {
      console.error("Failed to initialize WebGL renderer:", err);
      webglError =
        err?.message ||
        "WebGL context could not be created on this device.";
      cleanupThreeScene();
    }
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
    if (isContextLost || isPaused) return;

    animationFrameId = requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.016;

    if (animator && generator && attributes) {
      try {
        animator.update(delta, animationMode, attributes);
      } catch (e) {
        console.warn("Animation update error:", e);
      }
    }

    updateCameraPosition();

    if (renderer && scene && camera) {
      try {
        renderer.render(scene, camera);
      } catch (e) {
        console.warn("Render frame error:", e);
      }
    }
  }

  function handleResize() {
    if (!containerEl) return;
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;

    if (w === 0 || h === 0) return;

    if (!renderer || !scene || !camera) {
      initThreeScene();
      return;
    }

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

<div class="relative w-full h-full min-h-0 select-none touch-none overflow-hidden">
  <!-- 3D Canvas Viewport Container -->
  <div
    bind:this={containerEl}
    class="w-full h-full cursor-grab active:cursor-grabbing {webglError ? 'hidden' : 'block'}"
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

  <!-- Graceful Context Lost Toast Indicator -->
  {#if isContextLost}
    <div class="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs pointer-events-none">
      <div class="bg-slate-900 border border-amber-500/40 px-4 py-2 rounded-xl flex items-center gap-3 shadow-xl">
        <span class="loading loading-spinner loading-sm text-amber-400"></span>
        <span class="text-xs font-bold text-amber-200">Reconnecting 3D Engine...</span>
      </div>
    </div>
  {/if}

  <!-- Graceful Fallback if WebGL context could not be created or was blocked on mobile -->
  {#if webglError}
    <div class="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-radial from-slate-900 to-slate-950 text-center gap-4">
      <div class="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-4xl shadow-inner animate-pulse">
        🏇
      </div>
      <div class="flex flex-col gap-1 max-w-xs">
        <h3 class="text-base font-extrabold text-amber-400 uppercase tracking-wide">
          {attributes.name || "Custom Horse"}
        </h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          3D preview is paused due to device memory constraints. Your customization settings are fully preserved.
        </p>
      </div>

      <!-- Color Swatches Preview -->
      <div class="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/10">
        <div class="flex items-center gap-1.5">
          <span class="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs" style="background-color: {attributes.coatColor};" title="Coat"></span>
          <span class="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs" style="background-color: {attributes.patternColor};" title="Accent"></span>
          <span class="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs" style="background-color: {attributes.maneColor};" title="Mane"></span>
          <span class="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs" style="background-color: {attributes.hoofColor};" title="Hooves"></span>
        </div>
        <span class="text-[11px] font-bold text-slate-300 capitalize">{attributes.patternType}</span>
      </div>

      <button
        type="button"
        on:click={retryInit}
        class="btn btn-warning btn-sm font-black tracking-wider uppercase shadow-lg hover:scale-105 active:scale-95 transition-all mt-1"
      >
        ↻ Retry 3D Preview
      </button>
    </div>
  {/if}
</div>
