<script lang="ts">
    export const prerender = false;
    export const csr = true;
    export const ssr = false;
    import { onMount } from "svelte";
    import doubloon from "$lib/assets/icons/doubloon.png";
    import { sendMessage } from "$lib/webSocketService";
    import { gameClient } from "$lib/gameService";

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

            // Add shadow effect
            const shadow = this.add.circle(r_x, r_y + 15, 20, 0x000000, 0.3);
            shadow.setScale(0);
            shadow.depth = -1;

            this.tweens.add({
                targets: mole,
                scale: 0.2,
                duration: 700,
                ease: "Back.easeOut",
                yoyo: true,
                onComplete: () => {
                    mole.setActive(false);
                    mole.setVisible(false);
                    shadow.destroy();
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
                    shadow.destroy();
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

            // Add glow effect to doubloon
            const glow = this.add.circle(r_x, r_y, 30, 0xffd700, 0.3);
            glow.setScale(0);
            glow.setBlendMode(Phaser.BlendModes.ADD);
            glow.depth = -1;

            // Add shadow for doubloon
            const coinShadow = this.add.circle(
                r_x,
                r_y + 20,
                20,
                0x000000,
                0.2,
            );
            coinShadow.setScale(0);
            coinShadow.depth = -2;

            this.tweens.add({
                targets: doubloon,
                scale: 0.3,
                duration: 700,
                ease: "Back.easeOut",
                yoyo: true,
                onComplete: () => {
                    doubloon.setActive(false);
                    doubloon.setVisible(false);
                    glow.destroy();
                    coinShadow.destroy();
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
                    glow.destroy();
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
                    coinShadow.destroy();
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
        this.time.delayedCall(
            Phaser.Math.Between(100, 1000),
            spawnMole,
            [],
            this,
        );
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
                    Phaser.Geom.Rectangle.Contains(
                        m.getBounds(),
                        pointer.x,
                        pointer.y,
                    )
                );
            });
            const mole = moles.getChildren().find((m) => {
                return (
                    m.active &&
                    Phaser.Geom.Rectangle.Contains(
                        m.getBounds(),
                        pointer.x,
                        pointer.y,
                    )
                );
            });
            if (doubloon) {
                const coinX = doubloon.x;
                const coinY = doubloon.y;

                // Trigger sparkle particle effect
                sparkleEmitter.setPosition(coinX, coinY);
                sparkleEmitter.explode();

                // Scale up and fade out animation
                this.tweens.add({
                    targets: doubloon,
                    scale: 0.5,
                    alpha: 0,
                    duration: 300,
                    ease: "Back.easeIn",
                    onComplete: () => {
                        doubloon.setActive(false);
                        doubloon.setVisible(false);
                        doubloon.alpha = 1;
                    },
                });

                gameClient.sendPlayerInput({
                    payload: {
                        $case: "promptTextData",
                        promptTextData: {
                            answer: "coin",
                        },
                    },
                });
                return;
            }

            if (mole) {
                const moleX = mole.x;
                const moleY = mole.y;

                // Scale down with punch effect
                this.tweens.add({
                    targets: mole,
                    scale: 0,
                    duration: 200,
                    ease: "Back.easeIn",
                    onComplete: () => {
                        mole.setActive(false);
                        mole.setVisible(false);
                    },
                });

                boom.setPosition(moleX, moleY);
                boom.setVisible(true);
                boom.play("kaboom-boom");

                // Screen shake effect
                this.cameras.main.shake(200, 0.005);

                gameClient.sendPlayerInput({
                    payload: {
                        $case: "confirm",
                        confirm: {},
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
