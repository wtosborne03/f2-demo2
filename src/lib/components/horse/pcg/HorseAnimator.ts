import type { HorseGenerator } from './HorseGenerator';
import type { HorseAttributes, AnimationMode } from '../types';

export class HorseAnimator {
  private generator: HorseGenerator;
  private time: number = 0;
  private earTwitchTime: number = 0;
  private nextEarTwitch: number = 3;

  constructor(generator: HorseGenerator) {
    this.generator = generator;
  }

  public update(delta: number, mode: AnimationMode, attributes: HorseAttributes) {
    this.time += delta;
    const joints = this.generator.joints;
    if (!joints) return;

    const speedAttr = attributes.speed / 100;       // 0 to 1
    const aggroAttr = attributes.aggression / 100;  // 0 to 1

    if (mode === 'idle') {
      this.animateIdle(joints, delta, aggroAttr);
    } else if (mode === 'trot') {
      this.animateTrot(joints, speedAttr);
    } else if (mode === 'gallop') {
      this.animateGallop(joints, speedAttr, aggroAttr);
    }
  }

  private animateIdle(joints: HorseGenerator['joints'], delta: number, aggro: number) {
    const t = this.time * 1.8;

    // 1. Fixed Baseline Height (NO VERTICAL BOBBING!)
    joints.spine.position.y = this.generator.baseSpineY;
    joints.spine.rotation.x = 0;
    joints.spine.rotation.y = 0;
    
    // Tiny gentle lateral sway (0.17 degree)
    joints.spine.rotation.z = Math.sin(t * 0.4) * 0.003;

    // 2. All 4 Hooves Firmly Planted on Ground
    joints.frontLeft.shoulder.rotation.x = 0;
    joints.frontRight.shoulder.rotation.x = 0;
    joints.backLeft.hip.rotation.x = 0;
    joints.backRight.hip.rotation.x = 0;

    joints.frontLeft.knee.rotation.x = 0;
    joints.frontRight.knee.rotation.x = 0;
    joints.backLeft.hock.rotation.x = 0;
    joints.backRight.hock.rotation.x = 0;

    // 3. Subtle Chest Breathing
    const breath = Math.sin(t * 0.8) * 0.01;
    joints.chest.scale.x = 1.0 + breath;

    // 4. Subtle Neck & Head Motion
    joints.neckPivot.rotation.z = Math.sin(t * 0.3) * 0.005;
    joints.neckPivot.rotation.x = -0.18 + Math.sin(t * 0.5) * 0.008;
    joints.headPivot.rotation.x = 0.05 + Math.sin(t * 0.4) * 0.006;

    // 5. Tail Swish (Angled safely BACKWARD away from thighs)
    joints.tailPivot.rotation.x = -0.65 + Math.sin(t * 0.5) * 0.02;
    joints.tailPivot.rotation.z = Math.sin(t * 0.9) * 0.06;

    // 6. Natural Ear Twitching
    this.earTwitchTime += delta;
    if (this.earTwitchTime > this.nextEarTwitch) {
      const earAngle = (Math.random() - 0.5) * 0.35;
      joints.earLeft.rotation.x = earAngle;
      joints.earRight.rotation.x = -earAngle;
      this.earTwitchTime = 0;
      this.nextEarTwitch = 2.5 + Math.random() * 4;
    }
  }

  private animateTrot(joints: HorseGenerator['joints'], speedNorm: number) {
    const freq = 6.5 + speedNorm * 2.5;
    const t = this.time * freq;

    const pitch = Math.sin(t * 2) * 0.03;
    const bounce = Math.abs(Math.sin(t * 2)) * 0.08;

    joints.spine.position.y = this.generator.baseSpineY + bounce;
    joints.spine.rotation.z = pitch * 0.4;
    joints.spine.rotation.x = pitch;

    // Neck Bobbing
    joints.neckPivot.rotation.x = -0.18 - pitch * 1.0;
    joints.headPivot.rotation.x = 0.05 + pitch * 0.6;

    // Tail motion (flowing backward)
    joints.tailPivot.rotation.x = -0.4 + Math.sin(t * 2) * 0.1;
    joints.tailPivot.rotation.z = Math.cos(t) * 0.08;

    // Diagonal Leg Gait (FL + BR together, FR + BL together)
    const strideAngle = 0.45;
    const flAngle = Math.sin(t) * strideAngle;
    const frAngle = Math.sin(t + Math.PI) * strideAngle;

    // Front Left
    joints.frontLeft.shoulder.rotation.x = flAngle;
    joints.frontLeft.knee.rotation.x = flAngle < 0 ? Math.abs(flAngle) * 1.1 : 0.05;

    // Front Right
    joints.frontRight.shoulder.rotation.x = frAngle;
    joints.frontRight.knee.rotation.x = frAngle < 0 ? Math.abs(frAngle) * 1.1 : 0.05;

    // Back Left (moves with FR)
    joints.backLeft.hip.rotation.x = frAngle * 0.9;
    joints.backLeft.hock.rotation.x = frAngle > 0 ? -Math.abs(frAngle) * 1.0 : -0.05;

    // Back Right (moves with FL)
    joints.backRight.hip.rotation.x = flAngle * 0.9;
    joints.backRight.hock.rotation.x = flAngle > 0 ? -Math.abs(flAngle) * 1.0 : -0.05;
  }

  private animateGallop(joints: HorseGenerator['joints'], speedNorm: number, aggroNorm: number) {
    const freq = 9.5 + speedNorm * 5;
    const t = this.time * freq;

    // Dynamic Gallop bounding cycle
    const gallopPhase = Math.sin(t);
    const bodyPitch = gallopPhase * (0.12 + speedNorm * 0.1);
    const bodyHeight = this.generator.baseSpineY + Math.abs(Math.sin(t)) * (0.15 + speedNorm * 0.12);

    joints.spine.position.y = bodyHeight;
    joints.spine.rotation.z = -bodyPitch;

    // Forward Stretched Neck during flight/launch
    joints.neckPivot.rotation.x = -0.3 + bodyPitch * 1.2;
    joints.headPivot.rotation.x = -0.08 - bodyPitch * 0.6;

    // Streaming Tail with wind speed drag (flowing back)
    joints.tailPivot.rotation.x = -0.2 + Math.sin(t * 2) * 0.1;
    joints.tailPivot.rotation.z = Math.sin(t) * 0.06;

    // 4-Phase Gallop Stride kinematics
    const maxStride = 0.75 + speedNorm * 0.3;
    
    const flStride = Math.sin(t + 0.3) * maxStride;
    const frStride = Math.sin(t) * maxStride;

    joints.frontLeft.shoulder.rotation.x = flStride;
    joints.frontLeft.knee.rotation.x = flStride < 0 ? Math.abs(flStride) * 1.3 : 0.1;

    joints.frontRight.shoulder.rotation.x = frStride;
    joints.frontRight.knee.rotation.x = frStride < 0 ? Math.abs(frStride) * 1.3 : 0.1;

    const blStride = Math.sin(t + Math.PI + 0.2) * maxStride;
    const brStride = Math.sin(t + Math.PI) * maxStride;

    joints.backLeft.hip.rotation.x = blStride;
    joints.backLeft.hock.rotation.x = blStride > 0 ? -Math.abs(blStride) * 1.3 : -0.1;

    joints.backRight.hip.rotation.x = brStride;
    joints.backRight.hock.rotation.x = brStride > 0 ? -Math.abs(brStride) * 1.3 : -0.1;
  }
}
