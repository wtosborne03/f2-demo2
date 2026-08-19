<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";
  import { HorseGenerator } from "./pcg/HorseGenerator";
  import { HorseAnimator } from "./pcg/HorseAnimator";
  import type { HorseAttributes, AnimationMode } from "./types";
  import { GAMEPLAY_PALETTE } from "./materials/toonPalette";

  export let attributes: HorseAttributes;
  export let animationMode: AnimationMode = "idle";

  let containerEl: HTMLDivElement | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let generator: HorseGenerator | null = null;
  let animator: HorseAnimator | null = null;
  let blobShadowMesh: THREE.Mesh | null = null;
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
  let cameraTarget = new THREE.Vector3(0, 1.45, 0);
  let cameraRadius = 5.6;
  let cameraTheta = Math.PI / 3.8; // Dynamic 3/4 front view
  let cameraPhi = Math.PI / 2.35; // Slight top-down elevation

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
        navigator.userAgent,
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
    console.warn("HorsePreviewCanvas: WebGL Context lost.");
  }

  function handleContextRestored() {
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
        if (generator.containerGroup) {
          scene?.remove(generator.containerGroup);
        }
      } catch (e) {}
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
        domEl.removeEventListener(
          "webglcontextrestored",
          handleContextRestored,
        );
        if (domEl.parentNode) {
          domEl.parentNode.removeChild(domEl);
        }
      }

      try {
        renderer.dispose();
        renderer.forceContextLoss();
      } catch (e) {}
      renderer = null;
    }
  }

  export function retryInit() {
    webglError = null;
    isContextLost = false;
    cleanupThreeScene();
    initThreeScene();
  }

  function createBlobShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    gradient.addColorStop(0, "rgba(5, 8, 14, 0.75)");
    gradient.addColorStop(0.55, "rgba(5, 8, 14, 0.4)");
    gradient.addColorStop(1, "rgba(5, 8, 14, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  function initThreeScene() {
    if (!containerEl) return;
    const width = containerEl.clientWidth;
    const height = containerEl.clientHeight;

    if (width === 0 || height === 0) {
      return;
    }

    try {
      cleanupThreeScene();

      scene = new THREE.Scene();
      scene.background = null;

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      updateCameraPosition();

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
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, maxPixelRatio),
      );
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      const domEl = renderer.domElement;
      domEl.addEventListener("webglcontextlost", handleContextLost, false);
      domEl.addEventListener(
        "webglcontextrestored",
        handleContextRestored,
        false,
      );

      containerEl.appendChild(domEl);

      // Stylized 3-Point Cel-Shading Lighting Rig
      const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.85);
      scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.75);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfffaed, 2.4);
      sunLight.position.set(6, 12, 8);
      scene.add(sunLight);

      const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.35);
      rimLight.position.set(-7, 6, -8);
      scene.add(rimLight);

      // Blob Ground Shadow Disc
      const shadowGeo = new THREE.PlaneGeometry(3.6, 2.4);
      shadowGeo.rotateX(-Math.PI / 2);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: createBlobShadowTexture(),
        transparent: true,
        depthWrite: false,
      });
      blobShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      blobShadowMesh.position.set(0, 0.02, 0);
      scene.add(blobShadowMesh);

      // Generator & Animator Init
      generator = new HorseGenerator();
      animator = new HorseAnimator(generator);
      generator.updateAttributes(attributes);
      scene.add(generator.containerGroup);

      clock = new THREE.Clock();
      webglError = null;
      isContextLost = false;
      isPaused = false;

      animate();
    } catch (err: any) {
      console.error("Failed to initialize WebGL renderer:", err);
      webglError =
        err?.message || "WebGL context could not be created on this device.";
      cleanupThreeScene();
    }
  }

  function updateCameraPosition() {
    if (!camera) return;

    cameraPhi = Math.max(0.12, Math.min(Math.PI / 2.1, cameraPhi));

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

  function onMouseDown(e: MouseEvent) {
    onPointerDown(e.clientX, e.clientY);
  }
  function onMouseMove(e: MouseEvent) {
    onPointerMove(e.clientX, e.clientY);
  }

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
    cameraRadius = Math.max(3.2, Math.min(10.0, cameraRadius));
  }
</script>

<div
  class="relative w-full h-full min-h-0 select-none touch-none overflow-hidden"
>
  <!-- 3D Canvas Viewport Container -->
  <div
    bind:this={containerEl}
    class="w-full h-full cursor-grab active:cursor-grabbing {webglError
      ? 'hidden'
      : 'block'}"
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
    <div
      class="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs pointer-events-none"
    >
      <div
        class="bg-slate-900 border border-amber-500/40 px-4 py-2 rounded-xl flex items-center gap-3 shadow-xl"
      >
        <span class="loading loading-spinner loading-sm text-amber-400"></span>
        <span class="text-xs font-bold text-amber-200"
          >Reconnecting 3D Engine...</span
        >
      </div>
    </div>
  {/if}

  <!-- Graceful Fallback if WebGL context could not be created -->
  {#if webglError}
    <div
      class="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-radial from-slate-900 to-slate-950 text-center gap-4"
    >
      <div
        class="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-4xl shadow-inner animate-pulse"
      >
        🏇
      </div>
      <div class="flex flex-col gap-1 max-w-xs">
        <h3
          class="text-base font-extrabold text-amber-400 uppercase tracking-wide"
        >
          {attributes.name || "Custom Horse"}
        </h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          3D preview is paused. Your customization settings are fully preserved.
        </p>
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
