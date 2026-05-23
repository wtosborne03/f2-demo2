<script lang="ts">
  export const prerender = false;
  export const csr = true;
  export const ssr = false;
  import { onMount, onDestroy } from "svelte";
  import doubloon from "$lib/assets/icons/doubloon.png";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let game: Phaser.Game | null = null;

  onMount(async () => {
    const Phaser = await import("phaser");
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      render: {
        transparent: true,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        parent: "game-container",
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 600,
        height: 900,
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0, x: 0 },
        },
      },
    };

    game = new Phaser.Game(config);
  });

  onDestroy(() => {
    if (game) {
      game.destroy(true);
    }
  });

  function preload(this: Phaser.Scene) {
    this.load.image("mole", "bomb.png");
    this.load.image("hole", "hole.png");
    this.load.image("doubloon", doubloon);
    this.load.spritesheet("kaboom", "kaboom.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Create a sparkle particle texture
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("sparkle", 8, 8);
    graphics.destroy();
  }

  function create(this: Phaser.Scene) {
    const holes = this.physics.add.staticGroup();
    const moles = this.physics.add.group();
    const doubloons = this.physics.add.group();

    if (!this.anims.exists("kaboom-boom")) {
      this.anims.create({
        key: "kaboom-boom",
        frames: this.anims.generateFrameNumbers("kaboom", {
          start: 0,
          end: 7,
        }),
        repeat: 0,
        frameRate: 16,
      });
    }

    const boom = this.physics.add.sprite(100, 100, "kaboom");
    boom.setScale(5);
    boom.depth = 10;
    boom.setVisible(false);

    // Set it to hide when the explosion finishes
    boom.on("animationcomplete", () => {
      boom.setVisible(false);
    });

    // Create sparkle particle emitter for coin collection
    const sparkleEmitter = this.add.particles(0, 0, "sparkle", {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      gravityY: -200,
      quantity: 15,
      tint: [0xffd700, 0xffa500, 0xffff00, 0xffffff],
      blendMode: "ADD",
    });
    sparkleEmitter.stop();

    const holePositions: { x: number; y: number }[] = [
      { x: 150, y: 250 },
      { x: 300, y: 250 },
      { x: 450, y: 250 },
      { x: 150, y: 450 },
      { x: 300, y: 450 },
      { x: 450, y: 450 },
      { x: 150, y: 650 },
      { x: 300, y: 650 },
      { x: 450, y: 650 },
    ];

    holePositions.forEach((pos) => {
      const hole = holes.create(pos.x, pos.y, "hole") as Phaser.Physics.Arcade.Sprite;
      hole.setScale(0.2);
      hole.refreshBody();
    });

    function spawnMole(this: Phaser.Scene) {
      const availableHoles = holePositions.filter((pos) => {
        const isMoleHere = moles.getChildren().some((m) => {
          const sprite = m as Phaser.GameObjects.Sprite;
          return sprite.active && Phaser.Math.Distance.Between(sprite.x, sprite.y, pos.x, pos.y) < 10;
        });
        const isDoubloonHere = doubloons.getChildren().some((d) => {
          const sprite = d as Phaser.GameObjects.Sprite;
          return sprite.active && Phaser.Math.Distance.Between(sprite.x, sprite.y, pos.x, pos.y) < 10;
        });
        return !isMoleHere && !isDoubloonHere;
      });

      if (availableHoles.length === 0) {
        this.time.delayedCall(
          Phaser.Math.Between(100, 500),
          spawnMole,
          [],
          this,
        );
        return;
      }

      const randomHole = Phaser.Utils.Array.GetRandom(availableHoles);
      const r_x = randomHole.x;
      const r_y = randomHole.y;

      const mole = moles.create(r_x, r_y, "mole") as Phaser.Physics.Arcade.Sprite;
      mole.setScale(0.0);
      mole.setActive(true);
      mole.setVisible(true);

      // Add shadow effect
      const shadow = this.add.circle(r_x, r_y + 15, 20, 0x000000, 0.3);
      shadow.setScale(0);
      shadow.depth = -1;
      (mole as any).shadow = shadow;

      this.time.delayedCall(
        Phaser.Math.Between(1000, 2000),
        spawnMole,
        [],
        this,
      );

      this.tweens.add({
        targets: mole,
        scale: 0.2,
        duration: 700,
        ease: "Back.easeOut",
        yoyo: true,
        onComplete: () => {
          if (mole.active) {
            mole.destroy();
            shadow.destroy();
          }
        },
      });

      // Animate shadow
      this.tweens.add({
        targets: shadow,
        scaleX: 1.5,
        scaleY: 0.8,
        duration: 700,
        ease: "Back.easeOut",
        yoyo: true,
        onComplete: () => {
          if (shadow && shadow.active) {
            shadow.destroy();
          }
        },
      });
    }

    function spawnDoubloon(this: Phaser.Scene) {
      const availableHoles = holePositions.filter((pos) => {
        const isMoleHere = moles.getChildren().some((m) => {
          const sprite = m as Phaser.GameObjects.Sprite;
          return sprite.active && Phaser.Math.Distance.Between(sprite.x, sprite.y, pos.x, pos.y) < 10;
        });
        const isDoubloonHere = doubloons.getChildren().some((d) => {
          const sprite = d as Phaser.GameObjects.Sprite;
          return sprite.active && Phaser.Math.Distance.Between(sprite.x, sprite.y, pos.x, pos.y) < 10;
        });
        return !isMoleHere && !isDoubloonHere;
      });

      if (availableHoles.length === 0) {
        this.time.delayedCall(
          Phaser.Math.Between(500, 1000),
          spawnDoubloon,
          [],
          this,
        );
        return;
      }

      const randomHole = Phaser.Utils.Array.GetRandom(availableHoles);
      const r_x = randomHole.x;
      const r_y = randomHole.y;

      const doubloon = doubloons.create(r_x, r_y, "doubloon") as Phaser.Physics.Arcade.Sprite;
      doubloon.setScale(0.0);
      doubloon.setActive(true);
      doubloon.setVisible(true);

      // Add glow effect to doubloon
      const glow = this.add.circle(r_x, r_y, 30, 0xffd700, 0.3);
      glow.setScale(0);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.depth = -1;

      // Add shadow for doubloon
      const coinShadow = this.add.circle(r_x, r_y + 20, 20, 0x000000, 0.2);
      coinShadow.setScale(0);
      coinShadow.depth = -2;

      (doubloon as any).glow = glow;
      (doubloon as any).coinShadow = coinShadow;

      this.time.delayedCall(
        Phaser.Math.Between(2000, 3000),
        spawnDoubloon,
        [],
        this,
      );

      this.tweens.add({
        targets: doubloon,
        scale: 0.3,
        duration: 700,
        ease: "Back.easeOut",
        yoyo: true,
        onComplete: () => {
          if (doubloon.active) {
            doubloon.destroy();
            glow.destroy();
            coinShadow.destroy();
          }
        },
      });

      // Animate glow pulse
      this.tweens.add({
        targets: glow,
        scale: 2,
        alpha: 0.5,
        duration: 700,
        ease: "Sine.easeInOut",
        yoyo: true,
        onComplete: () => {
          if (glow && glow.active) {
            glow.destroy();
          }
        },
      });

      // Pulsing glow during lifetime
      this.tweens.add({
        targets: glow,
        alpha: 0.6,
        duration: 400,
        ease: "Sine.easeInOut",
        repeat: -1,
        yoyo: true,
      });

      // Animate shadow
      this.tweens.add({
        targets: coinShadow,
        scaleX: 1.5,
        scaleY: 0.6,
        duration: 700,
        ease: "Back.easeOut",
        yoyo: true,
        onComplete: () => {
          if (coinShadow && coinShadow.active) {
            coinShadow.destroy();
          }
        },
      });

      // Gentle rotation animation
      this.tweens.add({
        targets: doubloon,
        angle: 360,
        duration: 2000,
        ease: "Linear",
        repeat: -1,
      });
    }

    this.time.delayedCall(Phaser.Math.Between(100, 1000), spawnMole, [], this);
    this.time.delayedCall(
      Phaser.Math.Between(100, 1000),
      spawnDoubloon,
      [],
      this,
    );

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const doubloon = doubloons.getChildren().find((m) => {
        const sprite = m as Phaser.GameObjects.Sprite;
        return (
          sprite.active &&
          Phaser.Geom.Rectangle.Contains(sprite.getBounds(), pointer.x, pointer.y)
        );
      }) as Phaser.GameObjects.Sprite | undefined;

      const mole = moles.getChildren().find((m) => {
        const sprite = m as Phaser.GameObjects.Sprite;
        return (
          sprite.active &&
          Phaser.Geom.Rectangle.Contains(sprite.getBounds(), pointer.x, pointer.y)
        );
      }) as Phaser.GameObjects.Sprite | undefined;

      if (doubloon) {
        const coinX = doubloon.x;
        const coinY = doubloon.y;

        // Trigger sparkle particle effect
        sparkleEmitter.setPosition(coinX, coinY);
        sparkleEmitter.explode();

        // Kill active tweens and destroy glow/shadow immediately
        this.tweens.killTweensOf(doubloon);
        if ((doubloon as any).glow) {
          this.tweens.killTweensOf((doubloon as any).glow);
          (doubloon as any).glow.destroy();
        }
        if ((doubloon as any).coinShadow) {
          this.tweens.killTweensOf((doubloon as any).coinShadow);
          (doubloon as any).coinShadow.destroy();
        }

        // Scale up and fade out animation
        this.tweens.add({
          targets: doubloon,
          scale: 0.5,
          alpha: 0,
          duration: 300,
          ease: "Back.easeIn",
          onComplete: () => {
            doubloon.destroy();
          },
        });

        gameClient.sendPlayerInput("promptTextData", { answer: "coin" });
        return;
      }

      if (mole) {
        const moleX = mole.x;
        const moleY = mole.y;

        // Kill active tweens and destroy shadow immediately
        this.tweens.killTweensOf(mole);
        if ((mole as any).shadow) {
          this.tweens.killTweensOf((mole as any).shadow);
          (mole as any).shadow.destroy();
        }

        // Scale down with punch effect
        this.tweens.add({
          targets: mole,
          scale: 0,
          duration: 200,
          ease: "Back.easeIn",
          onComplete: () => {
            mole.destroy();
          },
        });

        boom.setPosition(moleX, moleY);
        boom.setVisible(true);
        boom.play("kaboom-boom");

        // Screen shake effect
        this.cameras.main.shake(200, 0.005);

        gameClient.sendPlayerInput("confirm");
      }
    });
  }

  function update(this: Phaser.Scene) {
    // Update logic if needed
  }
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="game-wrapper flex flex-col items-center justify-center relative w-full h-full">
  <!-- Glowing Background Effects -->
  <div class="bg-effects">
    <div class="pulse-wave"></div>
    <div class="grid-overlay"></div>
    <div class="scanline"></div>
  </div>

  <!-- HUD Header Overlay -->
  <header class="hud-header flex justify-between items-center w-full px-6 py-4 absolute top-0 z-20 pointer-events-none">
    <div class="player-info flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
      <div class="avatar-dot" style="background-color: {$gameState.color || '#fff'}"></div>
      <span class="player-name text-sm font-bold tracking-wider">{$gameState.name || 'Player'}</span>
    </div>

    <div class="score-info flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
      <span class="score-label text-xs text-white/50 font-tech">SCORE:</span>
      <span class="score-value text-sm font-bold font-orbitron text-amber-400">{$gameState.score}</span>
    </div>
  </header>

  <!-- Game Title / Instructions Banner -->
  <div class="hud-instructions absolute top-20 z-20 pointer-events-none text-center bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 border-y border-white/5 w-full py-2 backdrop-blur-sm">
    <h2 class="text-xs uppercase tracking-widest text-amber-300 font-bold font-orbitron animate-pulse">
      Tap Coins, Avoid Bombs!
    </h2>
  </div>

  <!-- Phaser Game Container -->
  <div id="game-container" class="relative z-10 w-full h-full max-w-[600px] max-h-[900px] aspect-[2/3]"></div>
</div>

<style>
  :global(.font-orbitron) {
    font-family: "Orbitron", sans-serif;
  }

  :global(.font-tech) {
    font-family: "Share Tech Mono", monospace;
  }

  .game-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100dvh;
    background: linear-gradient(135deg, #0e0516 0%, #15092a 50%, #0d0418 100%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #e0e0e0;
    padding-top: 6rem;
  }

  /* Background Effects */
  .bg-effects {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }

  .pulse-wave {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150%;
    height: 150%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      transparent 0%,
      transparent 45%,
      rgba(208, 188, 255, 0.03) 50%,
      transparent 55%
    );
    animation: pulse-expand 5s ease-out infinite;
  }

  @keyframes pulse-expand {
    0% {
      transform: translate(-50%, -50%) scale(0.6);
      opacity: 1;
    }
    100% {
      transform: translate(-50% , -50%) scale(1.4);
      opacity: 0;
    }
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
        rgba(208, 188, 255, 0.02) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, rgba(208, 188, 255, 0.02) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .scanline {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(208, 188, 255, 0.2),
      transparent
    );
    animation: scan 4s linear infinite;
  }

  @keyframes scan {
    0% {
      top: 0;
      opacity: 1;
    }
    100% {
      top: 100%;
      opacity: 0.3;
    }
  }

  .avatar-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: 0 0 10px currentColor;
  }

  #game-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
