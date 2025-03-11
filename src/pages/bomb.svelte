<script lang="ts">
  export const prerender = false;
  export const csr = true;
  export const ssr = false;
  import { onMount } from "svelte";
  import doubloon from "$lib/assets/icons/doubloon.png";
  import { sendMessage } from "$lib/webSocketService";

  let game: Phaser.Game;

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

    return () => {
      game.destroy(true);
    };
  });

  function preload(this: Phaser.Scene) {
    this.load.image("mole", "bomb.png");
    this.load.image("hole", "hole.png");
    this.load.image("doubloon", doubloon);
    this.load.spritesheet("kaboom", "kaboom.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  function create(this: Phaser.Scene) {
    const holes = this.physics.add.staticGroup();
    const moles = this.physics.add.group();
    const doubloons = this.physics.add.group();

    this.anims.create({
      key: "kaboom-boom",
      frames: this.anims.generateFrameNumbers("kaboom", {
        start: 0,
        end: 7,
      }),
      repeat: 0,
      frameRate: 16,
    });

    const boom = this.physics.add.sprite(100, 100, "kaboom");
    boom.setScale(5);
    boom.depth = 10;
    boom.setVisible(false);

    // Set it to hide when the explosion finishes
    boom.on("animationcomplete", () => {
      boom.setVisible(false);
    });

    const holePositions: { x: number; y: number }[] = [];

    holePositions.forEach((pos) => {
      const hole = holes.create(pos.x, pos.y, "hole");
      hole.setScale(0.2);
    });

    function spawnMole(this: Phaser.Scene) {
      const randomHole = Phaser.Utils.Array.GetRandom(holePositions);
      const r_x = 200 + Math.random() * 200;
      const r_y = 200 + Math.random() * 500;
      const mole = moles.create(r_x, r_y, "mole");
      mole.setScale(0.0);
      mole.setActive(true);
      mole.setVisible(true);
      this.time.delayedCall(
        Phaser.Math.Between(100, 1500),
        spawnMole,
        [],
        this,
      );

      this.tweens.add({
        targets: mole,
        scale: 0.2,
        duration: 700,
        ease: "Power2",
        yoyo: true, // Yoyo effect to make it pop down
        onComplete: () => {
          mole.setActive(false);
          mole.setVisible(false);
        },
      });
    }

    function spawnDoubloon(this: Phaser.Scene) {
      const randomHole = Phaser.Utils.Array.GetRandom(holePositions);
      const r_x = 200 + Math.random() * 200;
      const r_y = 200 + Math.random() * 500;
      const doubloon = doubloons.create(r_x, r_y, "doubloon");
      doubloon.setScale(0.0);
      doubloon.setActive(true);
      doubloon.setVisible(true);
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
        ease: "Power2",
        yoyo: true, // Yoyo effect to make it pop down
        onComplete: () => {
          doubloon.setActive(false);
          doubloon.setVisible(false);
        },
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
        return (
          m.active &&
          Phaser.Geom.Rectangle.Contains(m.getBounds(), pointer.x, pointer.y)
        );
      });
      const mole = moles.getChildren().find((m) => {
        return (
          m.active &&
          Phaser.Geom.Rectangle.Contains(m.getBounds(), pointer.x, pointer.y)
        );
      });
      if (doubloon) {
        doubloon.setActive(false);
        doubloon.setVisible(false);

        sendMessage({
          type: "game",
          data: {
            type: "coin",
          },
        });
        return;
      }

      if (mole) {
        mole.setActive(false);
        mole.setVisible(false);

        boom.setPosition(pointer.x, pointer.y);
        boom.setVisible(true);
        boom.play("kaboom-boom");
        sendMessage({
          type: "game",
          data: {
            type: "explode",
          },
        });
      }
    });
  }

  function update(this: Phaser.Scene) {
    // Update logic if needed
  }
</script>

<div id="game-container"></div>

<style>
  #game-container {
    width: 100%;
    height: 100%;
  }
</style>
