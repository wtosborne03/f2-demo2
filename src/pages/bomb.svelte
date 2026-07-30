<script lang="ts">
  export const prerender = false;
  export const csr = true;
  export const ssr = false;
  import { onMount } from "svelte";
  import doubloon from "$lib/assets/icons/doubloon.png";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import Phaser from "phaser";

  // Reactive player state and avatar
  $: avatarData = $gameState?.avatar;

  let game: Phaser.Game | null = null;
  let score = 0;
  let coinsCount = 0;
  let defusedCount = 0;
  let lives = 3;
  let isGameOver = false;

  // Expression state: 'neutral' | 'happy' | 'sad' | 'surprised'
  let currentExpression: "neutral" | "happy" | "sad" | "surprised" = "neutral";
  let expressionTimer: any = null;
  let isAvatarBouncing = false;
  let isAvatarShaking = false;

  // Floating text feedback popups
  interface FloatingText {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
  }
  let floatingTexts: FloatingText[] = [];
  let nextTextId = 0;

  function triggerExpression(
    exp: "happy" | "sad" | "surprised",
    duration = 1300,
  ) {
    currentExpression = exp;
    if (exp === "happy") {
      isAvatarBouncing = true;
      setTimeout(() => (isAvatarBouncing = false), 450);
    } else if (exp === "sad" || exp === "surprised") {
      isAvatarShaking = true;
      setTimeout(() => (isAvatarShaking = false), 450);
    }

    if (expressionTimer) clearTimeout(expressionTimer);
    expressionTimer = setTimeout(() => {
      currentExpression = "neutral";
    }, duration);
  }

  function addFloatingText(
    text: string,
    x: number,
    y: number,
    color = "#ffd700",
  ) {
    const id = nextTextId++;
    floatingTexts = [...floatingTexts, { id, text, x, y, color }];
    setTimeout(() => {
      floatingTexts = floatingTexts.filter((t) => t.id !== id);
    }, 900);
  }

  // Resolve active avatar image based on current expression
  $: avatarUrl = (() => {
    if (!avatarData) return null;
    const ex = avatarData.expressions;
    if (ex) {
      if (currentExpression === "happy" && (ex.happy_open || ex.happy_closed)) {
        return ex.happy_open || ex.happy_closed || avatarData.selfieUrl;
      }
      if (
        (currentExpression === "surprised" || currentExpression === "sad") &&
        (ex.surprised_open ||
          ex.sad_open ||
          ex.surprised_closed ||
          ex.sad_closed)
      ) {
        return (
          ex.surprised_open ||
          ex.sad_open ||
          ex.surprised_closed ||
          ex.sad_closed ||
          avatarData.selfieUrl
        );
      }
      if (ex.neutral_open || ex.neutral_closed) {
        return ex.neutral_open || ex.neutral_closed || avatarData.selfieUrl;
      }
    }
    return avatarData.selfieUrl || null;
  })();

  function vibrate(ms = 30) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  }

  function startGame() {
    score = 0;
    coinsCount = 0;
    defusedCount = 0;
    lives = 3;
    isGameOver = false;

    if (game) {
      game.destroy(true);
    }
    initPhaser();
  }

  function restartGame() {
    startGame();
  }

  onMount(() => {
    startGame();
    return () => {
      if (game) {
        game.destroy(true);
      }
      if (expressionTimer) clearTimeout(expressionTimer);
    };
  });

  function initPhaser() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      render: {
        transparent: true,
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        parent: "game-container",
        width: "100%",
        height: "100%",
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
          debug: false,
        },
      },
    };

    game = new Phaser.Game(config);
  }

  function preload(this: Phaser.Scene) {
    this.load.image("bomb", "bomb.png");
    this.load.image("doubloon", doubloon);
    this.load.spritesheet("kaboom", "kaboom.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Create sparkle texture dynamically
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("sparkle", 8, 8);
    graphics.destroy();
  }

  function create(this: Phaser.Scene) {
    const scene = this;
    const bombs = this.physics.add.group();
    const coins = this.physics.add.group();

    // Explosion animation
    this.anims.create({
      key: "kaboom-boom",
      frames: this.anims.generateFrameNumbers("kaboom", { start: 0, end: 7 }),
      repeat: 0,
      frameRate: 20,
    });

    const boomSprite = this.physics.add.sprite(-100, -100, "kaboom");
    boomSprite.setScale(3.5);
    boomSprite.depth = 50;
    boomSprite.setVisible(false);
    boomSprite.on("animationcomplete", () => boomSprite.setVisible(false));

    // Sparkle particle emitter for coin collection
    const sparkleEmitter = this.add.particles(0, 0, "sparkle", {
      speed: { min: 100, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      gravityY: -80,
      quantity: 20,
      tint: [0xffd700, 0xffa500, 0xffff00, 0xffffff],
      blendMode: "ADD",
    });
    sparkleEmitter.stop();

    // Defuse particle emitter
    const defuseEmitter = this.add.particles(0, 0, "sparkle", {
      speed: { min: 60, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 450,
      quantity: 15,
      tint: [0x00ff88, 0x00ffff, 0xffffff],
      blendMode: "ADD",
    });
    defuseEmitter.stop();

    // Dynamic scene dimensions helpers
    const getW = () => scene.scale.width || window.innerWidth;
    const getH = () => scene.scale.height || window.innerHeight;

    // Generous Avatar and Touch Hit Radii
    const AVATAR_RADIUS = 95;
    const TOUCH_GRAB_RADIUS = 85;

    // Drag & Fling Physics State
    let activeItem: Phaser.GameObjects.Sprite | null = null;
    let pointerHistory: Array<{ x: number; y: number; time: number }> = [];

    // Spawning logic
    let gameTimeElapsed = 0;

    function spawnBomb() {
      if (isGameOver) return;
      const w = getW();
      const x = Phaser.Math.Between(50, Math.max(100, w - 50));
      // Spawn higher up off-screen (-120) so bombs fall from above top of screen behind app bar
      const bomb = bombs.create(x, -120, "bomb") as Phaser.Physics.Arcade.Sprite;
      bomb.setScale(0.14);
      bomb.depth = 2;

      // Downward movement speed increases continuously over the 45 seconds game time
      const progress = Math.min(1, gameTimeElapsed / 45);
      const minSpeed = 80 + progress * 240; // 80 -> 320 px/s
      const maxSpeed = 130 + progress * 310; // 130 -> 440 px/s
      const speedY = Phaser.Math.Between(minSpeed, maxSpeed);
      bomb.setVelocityY(speedY);
      bomb.setAngularVelocity(Phaser.Math.Between(-40, 40));
      bomb.setData("type", "bomb");
      bomb.setData("isFlinged", false);

      // Schedule next bomb drop with shorter delays over 45s (1800ms down to 650ms)
      const nextDelay = Math.max(650, 1800 - progress * 1150);
      scene.time.delayedCall(nextDelay, spawnBomb);
    }

    function spawnCoin() {
      if (isGameOver) return;
      const w = getW();
      const h = getH();
      const x = Phaser.Math.Between(60, Math.max(120, w - 60));
      const y = Phaser.Math.Between(160, Math.max(250, h - 280));
      const coin = coins.create(
        x,
        y,
        "doubloon",
      ) as Phaser.Physics.Arcade.Sprite;

      // Start scale at 0 and pop/animate scale in
      coin.setScale(0);
      coin.depth = 3;

      scene.tweens.add({
        targets: coin,
        scale: 0.18,
        duration: 400,
        ease: "Back.easeOut",
      });

      // No gravity! Floating in place with gentle drift
      const body = coin.body as Phaser.Physics.Arcade.Body;
      body.allowGravity = false;
      body.setVelocity(
        Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(-15, 15),
      );

      coin.setData("type", "coin");
      coin.setData("isFlinged", false);
      coin.setData("spawnTime", scene.time.now);

      // Soft rotation tween
      scene.tweens.add({
        targets: coin,
        angle: 360,
        duration: 3500,
        repeat: -1,
        ease: "Linear",
      });

      // Schedule next coin drop
      const nextDelay = Phaser.Math.Between(2400, 3800);
      scene.time.delayedCall(nextDelay, spawnCoin);
    }

    // Start initial timers
    scene.time.delayedCall(600, spawnBomb);
    scene.time.delayedCall(1200, spawnCoin);

    // Track elapsed time for difficulty progression
    scene.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!isGameOver) gameTimeElapsed += 1;
      },
      loop: true,
    });

    // POINTER FLING CONTROLS (Fling-only gesture without dragging position)
    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (isGameOver) return;

      // Find top item touched under pointer with LARGE hit box radius (85px)
      const touchedBomb = bombs.getChildren().find((b: any) => {
        return (
          b.active &&
          !b.getData("isFlinged") &&
          Phaser.Geom.Circle.Contains(
            new Phaser.Geom.Circle(b.x, b.y, TOUCH_GRAB_RADIUS),
            pointer.x,
            pointer.y,
          )
        );
      }) as Phaser.GameObjects.Sprite;

      const touchedCoin = coins.getChildren().find((c: any) => {
        return (
          c.active &&
          !c.getData("isFlinged") &&
          Phaser.Geom.Circle.Contains(
            new Phaser.Geom.Circle(c.x, c.y, TOUCH_GRAB_RADIUS),
            pointer.x,
            pointer.y,
          )
        );
      }) as Phaser.GameObjects.Sprite;

      const target = touchedBomb || touchedCoin;
      if (target) {
        activeItem = target;
        pointerHistory = [{ x: pointer.x, y: pointer.y, time: scene.time.now }];
        vibrate(15);
      }
    });

    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (activeItem && activeItem.active) {
        // Track pointer movement history for fling velocity calculation without snapping object position
        pointerHistory.push({
          x: pointer.x,
          y: pointer.y,
          time: scene.time.now,
        });

        // Keep last 140ms history
        while (
          pointerHistory.length > 0 &&
          scene.time.now - pointerHistory[0].time > 140
        ) {
          pointerHistory.shift();
        }
      }
    });

    const releaseItem = (pointer: Phaser.Input.Pointer) => {
      if (activeItem && activeItem.active) {
        pointerHistory.push({
          x: pointer.x,
          y: pointer.y,
          time: scene.time.now,
        });

        let vx = 0;
        let vy = 0;
        if (pointerHistory.length >= 2) {
          const first = pointerHistory[0];
          const last = pointerHistory[pointerHistory.length - 1];
          const dt = (last.time - first.time) / 1000;
          if (dt > 0.008) {
            vx = (last.x - first.x) / dt;
            vy = (last.y - first.y) / dt;
          }
        }

        const speed = Math.hypot(vx, vy);
        const body = activeItem.body as Phaser.Physics.Arcade.Body;

        if (speed > 120) {
          // FLING ACTION!
          const mult = 1.35;
          body.setVelocity(vx * mult, vy * mult);
          body.allowGravity = false;
          activeItem.setData("isFlinged", true);
          vibrate(25);
        }
        activeItem = null;
      }
    };

    scene.input.on("pointerup", releaseItem);
    scene.input.on("pointerupoutside", releaseItem);

    // GAME UPDATE LOOP
    scene.events.on("update", (_time: number, delta: number) => {
      if (isGameOver) return;
      const progress = Math.min(1, gameTimeElapsed / 45);
      const w = getW();
      const h = getH();
      const AVATAR_X = w / 2;
      const AVATAR_Y = h - 90;

      // UPDATE BOMBS
      bombs.getChildren().forEach((bObj: any) => {
        const bomb = bObj as Phaser.Physics.Arcade.Sprite;
        if (!bomb.active) return;

        const isFlinged = bomb.getData("isFlinged");

        if (isFlinged) {
          // Check if bomb left screen boundaries -> DEFUSED!
          if (bomb.x < -80 || bomb.x > w + 80 || bomb.y < -120) {
            defuseEmitter.setPosition(
              Phaser.Math.Clamp(bomb.x, 30, w - 30),
              Phaser.Math.Clamp(bomb.y, 30, h - 30),
            );
            defuseEmitter.explode(15);
            // Screen shake effect on defusing a bomb!
            scene.cameras.main.shake(140, 0.007);

            addFloatingText("+50 DEFUSED!", bomb.x, bomb.y, "#00ff88");
            score += 50;
            defusedCount += 1;
            vibrate(20);
            gameClient.sendPlayerInput("defuse");
            bomb.destroy();
          } else {
            // Check if flinged bomb collides with player avatar at bottom
            const distToAvatar = Phaser.Math.Distance.Between(
              bomb.x,
              bomb.y,
              AVATAR_X,
              AVATAR_Y,
            );
            if (distToAvatar <= AVATAR_RADIUS || bomb.y >= AVATAR_Y + 10) {
              // BOOM! FLINGED BOMB HIT AVATAR -> DAMAGE / LOSE CONDITION
              boomSprite.setPosition(bomb.x, bomb.y);
              boomSprite.setVisible(true);
              boomSprite.play("kaboom-boom");
              scene.cameras.main.shake(250, 0.015);

              lives -= 1;
              vibrate(180);
              addFloatingText(
                "DIRECT HIT! -1 ❤️",
                AVATAR_X,
                AVATAR_Y - 50,
                "#ff0000",
              );

              if (lives <= 0) {
                isGameOver = true;
                triggerExpression("sad", 3000);
              } else {
                triggerExpression("surprised", 1300);
              }
              bomb.destroy();
              setTimeout(() => {
                gameClient.sendPlayerInput("confirm");
              }, 200);
            }
          }
        } else {
          // Downward acceleration for falling bombs increases as progress ramps over 45s
          const currentVy = bomb.body.velocity.y;
          const accelY = 40 + progress * 120;
          bomb.setVelocityY(currentVy + accelY * ((delta || 16.6) / 1000));

          // Check if falling bomb reached avatar zone at bottom
          const distToAvatar = Phaser.Math.Distance.Between(
            bomb.x,
            bomb.y,
            AVATAR_X,
            AVATAR_Y,
          );
          if (distToAvatar <= AVATAR_RADIUS || bomb.y >= AVATAR_Y + 10) {
            // BOOM! BOMB HIT PLAYER
            boomSprite.setPosition(bomb.x, bomb.y);
            boomSprite.setVisible(true);
            boomSprite.play("kaboom-boom");
            scene.cameras.main.shake(200, 0.01);

            lives -= 1;
            vibrate(150);
            addFloatingText("BOOM! -1 ❤️", AVATAR_X, AVATAR_Y - 50, "#ff4444");

            if (lives <= 0) {
              isGameOver = true;
              triggerExpression("sad", 3000);
            } else {
              triggerExpression("surprised", 1300);
            }
            bomb.destroy();
            setTimeout(() => {
              gameClient.sendPlayerInput("confirm");
            }, 200);
          }
        }
      });

      // UPDATE COINS
      coins.getChildren().forEach((cObj: any) => {
        const coin = cObj as Phaser.Physics.Arcade.Sprite;
        if (!coin.active) return;

        const distToAvatar = Phaser.Math.Distance.Between(
          coin.x,
          coin.y,
          AVATAR_X,
          AVATAR_Y,
        );

        // Check if coin reached Avatar zone -> COLLECTED!
        if (distToAvatar <= AVATAR_RADIUS + 10) {
          sparkleEmitter.setPosition(coin.x, coin.y);
          sparkleEmitter.explode(18);

          score += 100;
          coinsCount += 1;
          addFloatingText("+100 🪙", AVATAR_X, AVATAR_Y - 60, "#ffd700");
          triggerExpression("happy", 1300);
          vibrate(40);

          gameClient.sendPlayerInput("promptTextData", { answer: "coin" });
          coin.destroy();
          return;
        }

        // Flinged coin exiting screen without hitting avatar
        if (coin.getData("isFlinged")) {
          if (coin.x < -80 || coin.x > w + 80 || coin.y < -80 || coin.y > h + 80) {
            coin.destroy();
          }
        } else {
          // Uncollected coin timeout (10s)
          const spawnTime = coin.getData("spawnTime") || 0;
          if (scene.time.now - spawnTime > 10000) {
            scene.tweens.add({
              targets: coin,
              alpha: 0,
              duration: 400,
              onComplete: () => coin.destroy(),
            });
          }
        }
      });
    });
  }

  function update(this: Phaser.Scene) {}
</script>

<div
  class="fixed inset-0 w-full h-full bg-transparent text-white overflow-hidden flex flex-col justify-center items-center select-none font-sans"
>
  <!-- Minimal HUD Header (App bar rendering above canvas) -->
  <header
    class="absolute top-20 left-0 right-0 px-6 flex justify-between items-center z-30 pointer-events-none drop-shadow-md"
  >
    <div class="flex items-center space-x-4 font-bold text-sm md:text-base">
      <span class="text-amber-400">🪙 {coinsCount}</span>
      <span class="text-emerald-400">💣 {defusedCount}</span>
      <span class="text-indigo-200">{score} PTS</span>
    </div>
    <div class="flex items-center space-x-1 text-lg">
      {#each Array(3) as _, i}
        <span
          class="transition-opacity duration-300"
          class:opacity-25={i >= lives}
        >
          {i < lives ? "❤️" : "🖤"}
        </span>
      {/each}
    </div>
  </header>

  <!-- Phaser Game Container extending to top of screen behind app bar -->
  <div
    id="game-container"
    class="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden z-10"
  >
    <!-- Floating feedback texts layer -->
    <div class="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {#each floatingTexts as ft (ft.id)}
        <div
          class="absolute font-black text-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] animate-float-up pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style="left: {ft.x}px; top: {ft.y}px; color: {ft.color};"
        >
          {ft.text}
        </div>
      {/each}
    </div>

    <!-- Minimal Player Avatar Zone at Bottom Center -->
    <div
      class="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none transition-transform duration-300"
      class:animate-bounce-pop={isAvatarBouncing}
      class:animate-wiggle-shake={isAvatarShaking}
    >
      {#if avatarUrl}
        <img
          src={avatarUrl}
          alt="Player Selfie Avatar"
          class="w-full h-full object-cover"
        />
      {:else}
        <div
          class="w-full h-full bg-gradient-to-br from-indigo-500 to-pink-500 flex flex-col items-center justify-center p-2"
        >
          <div class="flex space-x-2 mb-1">
            <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
          </div>
          <div class="w-5 h-1.5 rounded-full bg-white/90"></div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Minimal Game Over Screen -->
  {#if isGameOver}
    <div
      class="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center px-6 animate-fade-in"
    >
      <div
        class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 max-w-xs w-full flex flex-col items-center text-center space-y-4 shadow-xl"
      >
        <h2 class="text-2xl font-black text-rose-400">GAME OVER</h2>

        <div class="w-full text-sm font-semibold space-y-2 text-slate-300">
          <div class="flex justify-between">
            <span>Score:</span>
            <span class="text-amber-300 font-bold">{score}</span>
          </div>
          <div class="flex justify-between">
            <span>Coins:</span>
            <span class="text-amber-400 font-bold">🪙 {coinsCount}</span>
          </div>
          <div class="flex justify-between">
            <span>Defused:</span>
            <span class="text-emerald-400 font-bold">💣 {defusedCount}</span>
          </div>
        </div>

        <button
          on:click={restartGame}
          class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-base rounded-xl transition-all"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(html, body) {
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    height: 100% !important;
    width: 100% !important;
  }

  #game-container {
    touch-action: none;
  }

  @keyframes floatUp {
    0% {
      opacity: 0;
      transform: translate(-50%, -30%) scale(0.7);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -80%) scale(1.1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -180%) scale(0.9);
    }
  }

  .animate-float-up {
    animation: floatUp 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes bouncePop {
    0%,
    100% {
      transform: scale(1);
    }
    40% {
      transform: scale(1.25) rotate(3deg);
    }
    70% {
      transform: scale(0.95) rotate(-2deg);
    }
  }

  .animate-bounce-pop {
    animation: bouncePop 0.45s ease-in-out;
  }

  @keyframes wiggleShake {
    0%,
    100% {
      transform: translateX(0);
    }
    20% {
      transform: translateX(-12px) rotate(-6deg);
    }
    40% {
      transform: translateX(12px) rotate(6deg);
    }
    60% {
      transform: translateX(-8px) rotate(-3deg);
    }
    80% {
      transform: translateX(8px) rotate(3deg);
    }
  }

  .animate-wiggle-shake {
    animation: wiggleShake 0.45s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
