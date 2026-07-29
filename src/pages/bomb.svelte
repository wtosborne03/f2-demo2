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
  let isGameStarted = false;

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

  function triggerExpression(exp: "happy" | "sad" | "surprised", duration = 1300) {
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

  function addFloatingText(text: string, x: number, y: number, color = "#ffd700") {
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
        (ex.surprised_open || ex.sad_open || ex.surprised_closed || ex.sad_closed)
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
    isGameStarted = true;

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
    boomSprite.setScale(4.5);
    boomSprite.depth = 50;
    boomSprite.setVisible(false);
    boomSprite.on("animationcomplete", () => boomSprite.setVisible(false));

    // Sparkle particle emitter for coin collection
    const sparkleEmitter = this.add.particles(0, 0, "sparkle", {
      speed: { min: 120, max: 350 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 700,
      gravityY: -100,
      quantity: 25,
      tint: [0xffd700, 0xffa500, 0xffff00, 0xffffff],
      blendMode: "ADD",
    });
    sparkleEmitter.stop();

    // Defuse particle emitter
    const defuseEmitter = this.add.particles(0, 0, "sparkle", {
      speed: { min: 80, max: 220 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 15,
      tint: [0x00ff88, 0x00ffff, 0xffffff],
      blendMode: "ADD",
    });
    defuseEmitter.stop();

    // Trajectory graphic line while dragging
    const dragGraphic = this.add.graphics();
    dragGraphic.depth = 100;

    // Avatar Hit Zone at Bottom (Centered at 300, 810, radius 70)
    const AVATAR_X = 300;
    const AVATAR_Y = 810;
    const AVATAR_RADIUS = 70;

    // Drag & Fling Physics State
    let activeItem: Phaser.GameObjects.Sprite | null = null;
    let pointerHistory: Array<{ x: number; y: number; time: number }> = [];

    // Spawning logic
    let gameTimeElapsed = 0;

    function spawnBomb() {
      if (isGameOver) return;
      const x = Phaser.Math.Between(70, 530);
      const bomb = bombs.create(x, -40, "bomb") as Phaser.Physics.Arcade.Sprite;
      bomb.setScale(0.22);
      bomb.setCircle(bomb.width * 0.4, bomb.width * 0.1, bomb.height * 0.1);

      // Speed increases gradually as game progresses
      const speedY = Phaser.Math.Between(160, 260) + Math.min(150, gameTimeElapsed * 4);
      bomb.setVelocityY(speedY);
      bomb.setAngularVelocity(Phaser.Math.Between(-80, 80));
      bomb.setData("type", "bomb");
      bomb.setData("isFlinged", false);

      // Schedule next bomb drop
      const nextDelay = Math.max(700, 1600 - gameTimeElapsed * 25);
      scene.time.delayedCall(nextDelay, spawnBomb);
    }

    function spawnCoin() {
      if (isGameOver) return;
      const x = Phaser.Math.Between(80, 520);
      const y = Phaser.Math.Between(180, 480);
      const coin = coins.create(x, y, "doubloon") as Phaser.Physics.Arcade.Sprite;
      coin.setScale(0.28);
      coin.setCircle(coin.width * 0.45, coin.width * 0.05, coin.height * 0.05);

      // No gravity! Floating in place with gentle drift
      const body = coin.body as Phaser.Physics.Arcade.Body;
      body.allowGravity = false;
      body.setVelocity(Phaser.Math.Between(-25, 25), Phaser.Math.Between(-20, 20));

      coin.setData("type", "coin");
      coin.setData("isFlinged", false);
      coin.setData("spawnTime", scene.time.now);

      // Soft rotation tween
      scene.tweens.add({
        targets: coin,
        angle: 360,
        duration: 3000,
        repeat: -1,
        ease: "Linear",
      });

      // Schedule next coin drop
      const nextDelay = Phaser.Math.Between(2200, 3500);
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

    // POINTER DRAG & FLING CONTROLS
    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (isGameOver) return;

      // Find top item touched under pointer
      const touchedBomb = bombs.getChildren().find((b: any) => {
        return (
          b.active &&
          !b.getData("isFlinged") &&
          Phaser.Geom.Circle.Contains(new Phaser.Geom.Circle(b.x, b.y, 45), pointer.x, pointer.y)
        );
      }) as Phaser.GameObjects.Sprite;

      const touchedCoin = coins.getChildren().find((c: any) => {
        return (
          c.active &&
          !c.getData("isFlinged") &&
          Phaser.Geom.Circle.Contains(new Phaser.Geom.Circle(c.x, c.y, 45), pointer.x, pointer.y)
        );
      }) as Phaser.GameObjects.Sprite;

      const target = touchedBomb || touchedCoin;
      if (target) {
        activeItem = target;
        const body = activeItem.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        body.allowGravity = false;
        pointerHistory = [{ x: pointer.x, y: pointer.y, time: scene.time.now }];
        vibrate(15);
      }
    });

    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (activeItem && activeItem.active) {
        activeItem.setPosition(pointer.x, pointer.y);
        pointerHistory.push({ x: pointer.x, y: pointer.y, time: scene.time.now });

        // Keep last 140ms
        while (pointerHistory.length > 0 && scene.time.now - pointerHistory[0].time > 140) {
          pointerHistory.shift();
        }

        // Draw trajectory trail
        dragGraphic.clear();
        if (pointerHistory.length > 1) {
          const start = pointerHistory[0];
          const isCoin = activeItem.getData("type") === "coin";
          dragGraphic.lineStyle(6, isCoin ? 0xffd700 : 0xff3366, 0.85);
          dragGraphic.beginPath();
          dragGraphic.moveTo(start.x, start.y);
          dragGraphic.lineTo(pointer.x, pointer.y);
          dragGraphic.strokePath();
        }
      }
    });

    const releaseItem = (pointer: Phaser.Input.Pointer) => {
      dragGraphic.clear();
      if (activeItem && activeItem.active) {
        pointerHistory.push({ x: pointer.x, y: pointer.y, time: scene.time.now });

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

        if (speed > 140) {
          // FLING ACTION!
          const mult = 1.35;
          body.setVelocity(vx * mult, vy * mult);
          body.allowGravity = false;
          activeItem.setData("isFlinged", true);
          vibrate(25);
        } else {
          // Soft drop
          if (activeItem.getData("type") === "bomb") {
            body.setVelocity(0, 150);
          }
        }
        activeItem = null;
      }
    };

    scene.input.on("pointerup", releaseItem);
    scene.input.on("pointerupoutside", releaseItem);

    // GAME UPDATE LOOP
    scene.events.on("update", () => {
      if (isGameOver) return;

      // UPDATE BOMBS
      bombs.getChildren().forEach((bObj: any) => {
        const bomb = bObj as Phaser.Physics.Arcade.Sprite;
        if (!bomb.active) return;

        const isFlinged = bomb.getData("isFlinged");

        if (isFlinged) {
          // Check if bomb left screen boundaries -> DEFUSED!
          if (bomb.x < -50 || bomb.x > 650 || bomb.y < -50) {
            defuseEmitter.setPosition(
              Phaser.Math.Clamp(bomb.x, 30, 570),
              Phaser.Math.Clamp(bomb.y, 30, 870)
            );
            defuseEmitter.explode(15);
            addFloatingText("+50 DEFUSED!", bomb.x, bomb.y, "#00ff88");
            score += 50;
            defusedCount += 1;
            gameClient.sendPlayerInput("confirm");
            vibrate(20);
            bomb.destroy();
          }
        } else {
          // Check if falling bomb reached avatar zone at bottom
          const distToAvatar = Phaser.Math.Distance.Between(bomb.x, bomb.y, AVATAR_X, AVATAR_Y);
          if (distToAvatar <= AVATAR_RADIUS || bomb.y >= 820) {
            // BOOM! BOMB HIT PLAYER
            boomSprite.setPosition(bomb.x, bomb.y);
            boomSprite.setVisible(true);
            boomSprite.play("kaboom-boom");
            scene.cameras.main.shake(250, 0.012);

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
          }
        }
      });

      // UPDATE COINS
      coins.getChildren().forEach((cObj: any) => {
        const coin = cObj as Phaser.Physics.Arcade.Sprite;
        if (!coin.active) return;

        const distToAvatar = Phaser.Math.Distance.Between(coin.x, coin.y, AVATAR_X, AVATAR_Y);

        // Check if coin reached Avatar zone -> COLLECTED!
        if (distToAvatar <= AVATAR_RADIUS + 15) {
          sparkleEmitter.setPosition(coin.x, coin.y);
          sparkleEmitter.explode(22);

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
          if (coin.x < -60 || coin.x > 660 || coin.y < -60 || coin.y > 960) {
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

<div class="relative w-full h-full min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col justify-center items-center select-none font-sans">
  <!-- HUD Header Overlay -->
  <header class="absolute top-4 left-0 right-0 px-6 flex justify-between items-center z-30 pointer-events-none">
    <!-- Score & Coins counter -->
    <div class="flex items-center space-x-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/50 shadow-lg">
      <div class="flex items-center space-x-1.5 text-amber-400 font-black text-lg">
        <span class="text-xl">🪙</span>
        <span>{coinsCount}</span>
      </div>
      <div class="w-px h-5 bg-slate-700"></div>
      <div class="flex items-center space-x-1.5 text-emerald-400 font-bold text-sm">
        <span>Defused:</span>
        <span class="font-extrabold">{defusedCount}</span>
      </div>
      <div class="w-px h-5 bg-slate-700"></div>
      <div class="text-indigo-300 font-black text-lg">
        {score} <span class="text-xs font-semibold text-slate-400">PTS</span>
      </div>
    </div>

    <!-- Lives Hearts -->
    <div class="flex items-center space-x-1 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/50 shadow-lg">
      {#each Array(3) as _, i}
        <span class="text-xl transition-all duration-300 transform" class:scale-125={i < lives} class:opacity-30={i >= lives}>
          {i < lives ? "❤️" : "🖤"}
        </span>
      {/each}
    </div>
  </header>

  <!-- Phaser Game Container -->
  <div id="game-container" class="relative w-full h-full max-w-[600px] max-h-[900px] flex items-center justify-center">
    <!-- Floating feedback texts layer -->
    <div class="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {#each floatingTexts as ft (ft.id)}
        <div
          class="absolute font-black text-xl md:text-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] animate-float-up pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style="left: {(ft.x / 600) * 100}%; top: {(ft.y / 900) * 100}%; color: {ft.color};"
        >
          {ft.text}
        </div>
      {/each}
    </div>

    <!-- Player Avatar Zone at Bottom Center -->
    <div
      class="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none transition-transform duration-300"
      class:animate-bounce-pop={isAvatarBouncing}
      class:animate-wiggle-shake={isAvatarShaking}
    >
      <!-- Target drop zone ring highlight -->
      <div class="relative w-28 h-28 rounded-full border-4 border-dashed border-indigo-400/40 flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm shadow-[0_0_25px_rgba(99,102,241,0.35)]">
        <!-- Glowing avatar frame -->
        <div class="relative w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-300/80 bg-slate-900 shadow-inner flex items-center justify-center">
          {#if avatarUrl}
            <img src={avatarUrl} alt="Player Selfie Avatar" class="w-full h-full object-cover" />
          {:else}
            <!-- High quality fallback vector face -->
            <div class="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-2">
              <div class="flex space-x-3 mb-1">
                <div class="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                <div class="w-3 h-3 rounded-full bg-white shadow-sm"></div>
              </div>
              <div class="w-6 h-2 rounded-full bg-white/90"></div>
            </div>
          {/if}

          <!-- Expression Emoji Overlay Badge -->
          <div class="absolute bottom-0 right-0 bg-slate-900/90 rounded-full w-7 h-7 flex items-center justify-center border border-indigo-400 text-sm shadow-md">
            {#if currentExpression === 'happy'}
              😃
            {:else if currentExpression === 'sad'}
              😢
            {:else if currentExpression === 'surprised'}
              😲
            {:else}
              🙂
            {/if}
          </div>
        </div>
      </div>
      <div class="mt-1 text-xs font-black uppercase tracking-wider text-indigo-200 bg-slate-900/80 px-3 py-0.5 rounded-full border border-indigo-500/40 shadow-sm">
        Fling Coins Here!
      </div>
    </div>
  </div>

  <!-- Game Over Screen -->
  {#if isGameOver}
    <div class="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center px-6 animate-fade-in">
      <div class="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-5">
        <div class="text-5xl">💥</div>
        <h2 class="text-3xl font-black text-rose-400 tracking-tight">GAME OVER</h2>
        
        <div class="w-full bg-slate-800/60 rounded-2xl p-4 space-y-3 border border-slate-700/40">
          <div class="flex justify-between items-center text-sm font-semibold">
            <span class="text-slate-400">Total Score:</span>
            <span class="text-amber-300 font-extrabold text-xl">{score}</span>
          </div>
          <div class="flex justify-between items-center text-sm font-semibold">
            <span class="text-slate-400">Coins Collected:</span>
            <span class="text-amber-400 font-bold">🪙 {coinsCount}</span>
          </div>
          <div class="flex justify-between items-center text-sm font-semibold">
            <span class="text-slate-400">Bombs Defused:</span>
            <span class="text-emerald-400 font-bold">💣 {defusedCount}</span>
          </div>
        </div>

        <button
          on:click={restartGame}
          class="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-95 text-white font-black text-lg rounded-2xl shadow-lg transition-all border border-indigo-400/30"
        >
          PLAY AGAIN 🚀
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
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
    0%, 100% { transform: scale(1); }
    40% { transform: scale(1.25) rotate(3deg); }
    70% { transform: scale(0.95) rotate(-2deg); }
  }

  .animate-bounce-pop {
    animation: bouncePop 0.45s ease-in-out;
  }

  @keyframes wiggleShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-12px) rotate(-6deg); }
    40% { transform: translateX(12px) rotate(6deg); }
    60% { transform: translateX(-8px) rotate(-3deg); }
    80% { transform: translateX(8px) rotate(3deg); }
  }

  .animate-wiggle-shake {
    animation: wiggleShake 0.45s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  .animate-fade-in {
    animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
