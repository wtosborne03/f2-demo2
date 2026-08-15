import type { HorseGenerator } from './HorseGenerator';
import type { HorseAttributes, AnimationMode } from '../types';
import * as THREE from 'three';

export class HorseAnimator {
  private generator: HorseGenerator;
  private time: number = 0;
  private earTwitchTime: number = 0;
  private nextEarTwitch: number = 3;
  private tailVelocity: number = 0;
  private prevPositionY: number = 0;
  private landingImpactSpring: number = 0; // 0 to 1 impact compression
  private tumbleRotationX: number = 0;
  private tumbleRotationZ: number = 0;

  constructor(generator: HorseGenerator) {
    this.generator = generator;
  }

  public update(
    delta: number,
    mode: AnimationMode,
    racerOrAttrs: any,
    customSpeedMultiplier: number = 1.0
  ) {
    const isRacer = racerOrAttrs && 'attributes' in racerOrAttrs;
    const racer = isRacer ? racerOrAttrs : null;
    const attributes: HorseAttributes = isRacer
      ? racerOrAttrs.attributes
      : (racerOrAttrs as HorseAttributes);

    this.time += delta * customSpeedMultiplier;
    const joints = this.generator.joints;
    if (!joints) return;

    const speedAttr = (attributes?.speed ?? 50) / 100; // 0 to 1
    const aggroAttr = (attributes?.aggression ?? 50) / 100; // 0 to 1

    // 1. Detect Special Physical States
    const isAirborneBomb = racer && (racer.positionY > 0.2 || racer.recoilVelocityY !== 0);
    const isSlipOut = racer && racer.spinOutTimer > 0;
    const isSteroid = racer && racer.steroidRageTimer > 0;
    const isWhip = racer && racer.whipBoostTimer > 0;
    const isExhausted = racer && racer.isExhausted;

    // 2. Track High-Impact Landing Compression
    if (racer) {
      if (this.prevPositionY > 0.3 && racer.positionY <= 0.1) {
        this.landingImpactSpring = 1.0;
      }
      this.prevPositionY = racer.positionY;
    }

    if (this.landingImpactSpring > 0) {
      this.landingImpactSpring = Math.max(0, this.landingImpactSpring - delta * 4.5);
    }

    // 3. Execute Mode or Physical Hazard Animation
    if (isAirborneBomb) {
      this.animateBombBlastAirborne(joints, racer!, delta);
    } else if (isSlipOut) {
      this.animateBananaSlipOut(joints, racer!, delta);
    } else if (mode === 'idle') {
      this.animateIdle(joints, delta, isSteroid, isExhausted);
    } else if (mode === 'trot') {
      this.animateTrot(joints, speedAttr, isSteroid, isExhausted, delta);
    } else if (mode === 'gallop') {
      this.animateGallop(joints, speedAttr, aggroAttr, delta, racer, isSteroid, isWhip, isExhausted);
    } else if (mode === 'rear') {
      this.animateRear(joints, delta);
    }

    // Reset horseGroup 3D tumbling when not airborne
    if (!isAirborneBomb && this.generator.horseGroup) {
      this.generator.horseGroup.rotation.set(0, 0, 0);
      this.tumbleRotationX = 0;
      this.tumbleRotationZ = 0;
    }
  }

  /**
   * Natural Organic Idle with rhythmic breathing, subtle weight shift, and ear twitches
   */
  private animateIdle(
    joints: HorseGenerator['joints'],
    delta: number,
    isSteroid: boolean = false,
    isExhausted: boolean = false
  ) {
    const t = this.time * 1.8;

    // Organic Baseline Height with subtle resting weight shifts
    const idleWeightShift = Math.sin(t * 0.5) * 0.015;
    joints.spine.position.y = this.generator.baseSpineY + idleWeightShift;
    joints.spine.rotation.x = Math.sin(t * 0.4) * 0.008;
    joints.spine.rotation.y = Math.cos(t * 0.3) * 0.008;
    joints.spine.rotation.z = Math.sin(t * 0.4) * 0.008;

    // Natural resting limb stance
    joints.frontLeft.shoulder.rotation.set(0.02, 0, 0.01);
    joints.frontRight.shoulder.rotation.set(-0.02, 0, -0.01);
    joints.backLeft.hip.rotation.set(-0.02, 0, 0.01);
    joints.backRight.hip.rotation.set(0.02, 0, -0.01);

    joints.frontLeft.knee.rotation.set(0.04, 0, 0);
    joints.frontRight.knee.rotation.set(0.04, 0, 0);
    joints.backLeft.hock.rotation.set(-0.04, 0, 0);
    joints.backRight.hock.rotation.set(-0.04, 0, 0);

    joints.frontLeft.hoof.rotation.set(0.16, 0, 0);
    joints.frontRight.hoof.rotation.set(0.16, 0, 0);
    joints.backLeft.hoof.rotation.set(0.16, 0, 0);
    joints.backRight.hoof.rotation.set(0.16, 0, 0);

    // Organic Breathing & Muscle Swell
    const breathRate = isExhausted ? 4.5 : 1.2;
    const breathAmount = isExhausted ? 0.08 : 0.025;
    const breath = Math.sin(this.time * breathRate) * breathAmount;

    joints.chest.scale.set(0.88 * (1.0 + breath * 1.4), 1.08 * (1.0 + breath * 0.8), 1.1);
    joints.torso.scale.set(1.0 + breath, 1.0 + breath * 0.7, 1.0);
    joints.rump.scale.set(0.92, 1.05 + breath * 0.5, 0.95);

    if (isSteroid) {
      joints.chest.scale.multiplyScalar(1.28);
      joints.rump.scale.multiplyScalar(1.22);
    }

    // Subtle Neck & Head Motion
    joints.neckPivot.rotation.z = Math.sin(t * 0.3) * 0.01;
    joints.neckPivot.rotation.x = (isExhausted ? -0.1 : -0.22) + Math.sin(t * 0.5) * 0.018;
    joints.headPivot.rotation.x = (isExhausted ? 0.25 : 0.05) + Math.sin(t * 0.4) * 0.015;

    // Fluid Secondary Tail Swish
    joints.tailPivot.rotation.x = -0.65 + Math.sin(t * 0.5) * 0.04;
    joints.tailPivot.rotation.z = Math.sin(t * 0.8) * 0.09;
    joints.tailSegments?.forEach((seg, i) => {
      seg.rotation.z = Math.sin(t * 0.8 - i * 0.35) * (0.06 + i * 0.04);
      seg.rotation.x = (seg as any).userData?.baseRx || 0.15;
    });

    // Gentle Mane Flutter
    joints.maneTufts?.forEach((tuft, i) => {
      tuft.rotation.z = Math.sin(t * 0.6 - i * 0.25) * 0.03;
    });

    // Ear Twitching
    this.earTwitchTime += delta;
    if (this.earTwitchTime > this.nextEarTwitch) {
      const earAngle = (Math.random() - 0.5) * 0.35;
      joints.earLeft.rotation.x = earAngle;
      joints.earRight.rotation.x = -earAngle;
      this.earTwitchTime = 0;
      this.nextEarTwitch = 2.5 + Math.random() * 4;
    }
  }

  /**
   * Smooth, Fluid, Organic Trot & Walk with harmonic vertical spine bobbing and continuous kinematics
   */
  private animateTrot(
    joints: HorseGenerator['joints'],
    speedNorm: number,
    isSteroid: boolean = false,
    isExhausted: boolean = false,
    delta: number = 0.016
  ) {
    const freq = 5.6 + speedNorm * 2.8;
    const t = this.time * freq;

    // 1. Organic Harmonic Vertical Spine Bobbing
    const verticalBob = Math.sin(t * 2) * 0.16 + Math.sin(t * 4) * 0.025;
    joints.spine.position.y = this.generator.baseSpineY + verticalBob;

    // 2. Smooth Rocking Spine Pitch and Lateral Roll/Yaw (Weight Transfer)
    const spinePitch = Math.sin(t * 2 + 0.3) * 0.065;
    joints.spine.rotation.x = spinePitch;
    joints.spine.rotation.z = Math.sin(t) * 0.038; // Lateral roll tilt
    joints.spine.rotation.y = Math.cos(t) * 0.028; // Hip yaw swivel

    // Secondary segment displacement for anatomical rolling motion
    joints.chest.position.y = -0.02 + Math.sin(t * 2 + 0.5) * 0.06;
    joints.rump.position.y = 0.06 - Math.sin(t * 2) * 0.07;
    joints.withers.position.y = 0.42 + Math.sin(t * 2 + 0.4) * 0.04;

    // 3. Elastic Torso Squash & Stretch
    const trotStretch = Math.sin(t * 2) * 0.045;
    joints.torso.scale.set(
      1.0 - trotStretch * 0.3,
      1.0 - trotStretch * 0.3,
      1.0 + trotStretch * 0.5
    );

    // 4. Smooth Counter-Weighting Neck & Head Nod
    joints.neckPivot.rotation.x =
      (isExhausted ? -0.1 : -0.24) - spinePitch * 1.35 + Math.sin(t * 2 + 0.2) * 0.05;
    joints.neckPivot.rotation.z = Math.sin(t) * 0.032;
    joints.headPivot.rotation.x =
      (isExhausted ? 0.22 : 0.07) + spinePitch * 0.95 - Math.sin(t * 2) * 0.04;

    // 5. Continuous Smooth Leg Kinematics
    const strideAngle = 0.54 + speedNorm * 0.14;

    // Diagonal gait pair phases
    const flPhase = t;
    const frPhase = t + Math.PI;
    const blPhase = t + Math.PI;
    const brPhase = t;

    const flAngle = Math.sin(flPhase) * strideAngle;
    const frAngle = Math.sin(frPhase) * strideAngle;
    const blAngle = Math.sin(blPhase) * (strideAngle * 0.92);
    const brAngle = Math.sin(brPhase) * (strideAngle * 0.92);

    // Shoulders & Hips
    joints.frontLeft.shoulder.rotation.set(flAngle, 0, Math.sin(t) * 0.02);
    joints.frontRight.shoulder.rotation.set(frAngle, 0, -Math.sin(t) * 0.02);
    joints.backLeft.hip.rotation.set(blAngle, 0, Math.sin(t) * 0.02);
    joints.backRight.hip.rotation.set(brAngle, 0, -Math.sin(t) * 0.02);

    // Phase-lagged Knee and Hock Flexion
    const flSwing = Math.max(0, -Math.sin(flPhase - 0.35));
    const flKneeBend = (flSwing ** 1.35) * (strideAngle * 2.15) + 0.04;
    joints.frontLeft.knee.rotation.set(flKneeBend, 0, 0);

    const frSwing = Math.max(0, -Math.sin(frPhase - 0.35));
    const frKneeBend = (frSwing ** 1.35) * (strideAngle * 2.15) + 0.04;
    joints.frontRight.knee.rotation.set(frKneeBend, 0, 0);

    const blSwing = Math.max(0, Math.sin(blPhase - 0.35));
    const blHockBend = -(blSwing ** 1.35) * (strideAngle * 1.95) - 0.04;
    joints.backLeft.hock.rotation.set(blHockBend, 0, 0);

    const brSwing = Math.max(0, Math.sin(brPhase - 0.35));
    const brHockBend = -(brSwing ** 1.35) * (strideAngle * 1.95) - 0.04;
    joints.backRight.hock.rotation.set(brHockBend, 0, 0);

    // Springy Hoof / Ankle Articulation
    joints.frontLeft.hoof.rotation.set(0.16 + (flSwing ** 1.5) * 0.38 - (Math.max(0, Math.sin(flPhase)) ** 1.5) * 0.18, 0, 0);
    joints.frontRight.hoof.rotation.set(0.16 + (frSwing ** 1.5) * 0.38 - (Math.max(0, Math.sin(frPhase)) ** 1.5) * 0.18, 0, 0);
    joints.backLeft.hoof.rotation.set(0.16 - (blSwing ** 1.5) * 0.32, 0, 0);
    joints.backRight.hoof.rotation.set(0.16 - (brSwing ** 1.5) * 0.32, 0, 0);

    // 6. Flowing Multi-Segment Tail Physics
    joints.tailPivot.rotation.x = -0.42 + Math.sin(t * 2) * 0.14;
    joints.tailPivot.rotation.z = Math.cos(t) * 0.15;
    joints.tailSegments?.forEach((seg, i) => {
      seg.rotation.z = Math.cos(t - i * 0.38) * (0.09 + i * 0.06);
      seg.rotation.x = Math.sin(t * 2 - i * 0.3) * 0.08;
    });

    // 7. Secondary Mane Waves
    joints.maneTufts?.forEach((tuft, i) => {
      tuft.rotation.z = Math.sin(t * 2 - i * 0.32) * 0.07;
      tuft.rotation.x = -Math.PI / 4.2 + 0.1 + Math.cos(t * 2 - i * 0.3) * 0.05;
    });
  }

  /**
   * High-Energy 4-Beat Gallop
   */
  private animateGallop(
    joints: HorseGenerator['joints'],
    speedNorm: number,
    aggroNorm: number,
    delta: number,
    racer: any,
    isSteroid: boolean = false,
    isWhip: boolean = false,
    isExhausted: boolean = false
  ) {
    const freq = 9.8 + speedNorm * 6.8;
    const t = this.time * freq;

    // 1. Accordion Squash & Stretch
    const gallopWave = Math.sin(t);
    const stretchFactor = gallopWave * (0.17 + speedNorm * 0.11);

    let torsoScaleZ = 1.0 + stretchFactor * 0.72;
    let torsoScaleX = 1.0 - stretchFactor * 0.4;
    let torsoScaleY = 1.0 - stretchFactor * 0.4;

    if (isWhip) {
      torsoScaleZ *= 1.12;
    }

    // Impact Elastic Shockwave Recovery
    if (this.landingImpactSpring > 0) {
      torsoScaleY *= 1.0 - this.landingImpactSpring * 0.36;
      torsoScaleX *= 1.0 + this.landingImpactSpring * 0.3;
    }

    joints.torso.scale.set(torsoScaleX, torsoScaleY, torsoScaleZ);

    // 2. Flank Breathing & Muscle Pulsation
    const breathRate = isExhausted ? 8.0 : 4.0;
    const breathAmount = isExhausted ? 0.1 : 0.035;
    const breath = Math.sin(this.time * breathRate) * breathAmount;

    let chestScaleX = 0.88 * (1.0 - stretchFactor * 0.3) * (1.0 + breath);
    let chestScaleY = 1.08 * (1.0 - stretchFactor * 0.3);
    let chestScaleZ = 1.1 * (1.0 + stretchFactor * 0.4);

    let rumpScaleX = 0.92 * (1.0 - stretchFactor * 0.3) * (1.0 + breath * 0.8);
    let rumpScaleY = 1.05 * (1.0 - stretchFactor * 0.3);
    let rumpScaleZ = 0.95 * (1.0 + stretchFactor * 0.4);

    if (isSteroid) {
      chestScaleX *= 1.32;
      chestScaleY *= 1.25;
      rumpScaleX *= 1.28;
      rumpScaleY *= 1.22;
      joints.neckMesh.scale.set(1.2, 1.0, 1.35);
    } else {
      joints.neckMesh.scale.set(0.8, 1.0, 1.15);
    }

    joints.chest.scale.set(chestScaleX, chestScaleY, chestScaleZ);
    joints.rump.scale.set(rumpScaleX, rumpScaleY, rumpScaleZ);

    // 3. Dynamic Harmonic Vertical Body Bobbing
    const verticalBob = (Math.sin(t) * 0.34 + Math.sin(t * 2 - 0.55) * 0.13) * (1.0 + speedNorm * 0.38);
    joints.spine.position.y = this.generator.baseSpineY + verticalBob;

    // 4. Vertebral Column Pitch Rocking & Secondary Segments
    const spinePitch = Math.sin(t + 0.35) * (0.24 + speedNorm * 0.13);
    joints.spine.rotation.x = spinePitch;

    joints.chest.position.y = -0.02 + Math.sin(t + 0.4) * 0.13;
    joints.rump.position.y = 0.06 - Math.sin(t - 0.2) * 0.15;
    joints.withers.position.y = 0.42 + Math.sin(t + 0.3) * 0.09;

    joints.spine.rotation.z = Math.sin(t) * 0.035;
    joints.spine.rotation.y = Math.cos(t) * 0.025;

    // 6. Dynamic Pendulum Neck & Head Counterweight Inertia
    const headBob = Math.sin(t + 0.35) * (0.22 + speedNorm * 0.12);
    joints.neckPivot.position.z = -1.15 - stretchFactor * 0.18;
    joints.neckPivot.rotation.x =
      (isSteroid ? -0.55 : isExhausted ? -0.15 : -0.36) - headBob - stretchFactor * 0.16;
    joints.headPivot.rotation.x =
      (isExhausted ? 0.28 : -0.08) + headBob * 0.85 + stretchFactor * 0.2;

    // 7. Smooth 4-Beat Kinematics
    const maxStride = 0.92 + speedNorm * 0.42;

    const flPhase = t + 0.42;
    const frPhase = t;
    const flStride = Math.sin(flPhase) * maxStride;
    const frStride = Math.sin(frPhase) * maxStride;

    joints.frontLeft.shoulder.rotation.set(flStride, 0, Math.sin(t) * 0.03);
    joints.frontRight.shoulder.rotation.set(frStride, 0, -Math.sin(t) * 0.03);

    const flSwing = Math.max(0, -Math.sin(flPhase - 0.3));
    const frSwing = Math.max(0, -Math.sin(frPhase - 0.3));
    joints.frontLeft.knee.rotation.set((flSwing ** 1.3) * (1.68 + speedNorm * 0.3) + 0.05, 0, 0);
    joints.frontRight.knee.rotation.set((frSwing ** 1.3) * (1.68 + speedNorm * 0.3) + 0.05, 0, 0);

    const blPhase = t + Math.PI + 0.32;
    const brPhase = t + Math.PI;
    const blStride = Math.sin(blPhase) * maxStride;
    const brStride = Math.sin(brPhase) * maxStride;

    joints.backLeft.hip.rotation.set(blStride, 0, Math.sin(t) * 0.03);
    joints.backRight.hip.rotation.set(brStride, 0, -Math.sin(t) * 0.03);

    const blSwing = Math.max(0, Math.sin(blPhase - 0.3));
    const brSwing = Math.max(0, Math.sin(brPhase - 0.3));
    joints.backLeft.hock.rotation.set(-(blSwing ** 1.3) * (1.68 + speedNorm * 0.3) - 0.05, 0, 0);
    joints.backRight.hock.rotation.set(-(brSwing ** 1.3) * (1.68 + speedNorm * 0.3) - 0.05, 0, 0);

    // Springy Hoof Flexion
    joints.frontLeft.hoof.rotation.set(0.16 + (flSwing ** 1.4) * 0.45, 0, 0);
    joints.frontRight.hoof.rotation.set(0.16 + (frSwing ** 1.4) * 0.45, 0, 0);
    joints.backLeft.hoof.rotation.set(0.16 - (blSwing ** 1.4) * 0.45, 0, 0);
    joints.backRight.hoof.rotation.set(0.16 - (brSwing ** 1.4) * 0.45, 0, 0);

    // 8. Dynamic Multi-Segment Tail Wave Dynamics
    const targetTailX = -0.18 + Math.sin(t) * 0.24;
    const tailForce = (targetTailX - joints.tailPivot.rotation.x) * 28.0;
    this.tailVelocity += tailForce * delta;
    this.tailVelocity *= 0.84;
    joints.tailPivot.rotation.x += this.tailVelocity * delta;
    joints.tailPivot.rotation.z = Math.sin(t) * 0.18;

    joints.tailSegments?.forEach((seg, i) => {
      seg.rotation.z = Math.sin(t - i * 0.42) * (0.13 + i * 0.08);
      seg.rotation.x = Math.sin(t * 2 - i * 0.32) * 0.1;
    });

    // 9. Mane Tuft Wind Waves
    joints.maneTufts?.forEach((tuft, i) => {
      tuft.rotation.z = Math.sin(t * 3 - i * 0.42) * 0.1;
      tuft.rotation.x = -Math.PI / 4.2 + 0.1 + Math.cos(t * 3 - i * 0.35) * 0.08;
    });
  }

  /**
   * Banana Peel Slip-Out
   */
  private animateBananaSlipOut(
    joints: HorseGenerator['joints'],
    racer: any,
    delta: number
  ) {
    const slipT = this.time * 24.0;

    const wobbleY = 0.52 + Math.sin(slipT) * 0.14;
    joints.torso.scale.set(1.48, wobbleY, 1.35);
    joints.chest.scale.set(1.42, wobbleY * 1.1, 1.3);
    joints.rump.scale.set(1.42, wobbleY * 1.1, 1.3);

    joints.spine.position.y = this.generator.baseSpineY - 0.55 + Math.sin(slipT * 0.8) * 0.1;
    joints.spine.rotation.z = Math.sin(slipT * 1.1) * 0.5;
    joints.spine.rotation.x = Math.cos(slipT * 0.9) * 0.38;
    joints.spine.rotation.y = Math.sin(slipT * 0.7) * 0.35;

    joints.frontLeft.shoulder.rotation.set(
      Math.sin(slipT) * 0.4,
      0,
      0.8 + Math.sin(slipT) * 0.25
    );
    joints.frontRight.shoulder.rotation.set(
      Math.cos(slipT) * 0.4,
      0,
      -0.8 - Math.sin(slipT + 1) * 0.25
    );

    joints.backLeft.hip.rotation.set(
      Math.cos(slipT) * 0.4,
      0,
      0.85 + Math.cos(slipT) * 0.25
    );
    joints.backRight.hip.rotation.set(
      Math.sin(slipT) * 0.4,
      0,
      -0.85 - Math.cos(slipT + 1) * 0.25
    );

    joints.frontLeft.knee.rotation.set(1.1, 0, 0);
    joints.frontRight.knee.rotation.set(1.1, 0, 0);
    joints.backLeft.hock.rotation.set(-1.1, 0, 0);
    joints.backRight.hock.rotation.set(-1.1, 0, 0);

    joints.neckPivot.rotation.z = Math.sin(slipT * 0.8) * 0.7;
    joints.neckPivot.rotation.x = 0.25 + Math.cos(slipT * 0.6) * 0.45;
    joints.headPivot.rotation.y = Math.sin(slipT * 1.2) * 0.6;

    joints.tailPivot.rotation.z = Math.sin(slipT * 2.0) * 1.2;
    joints.tailPivot.rotation.x = -0.85 + Math.cos(slipT * 2.0) * 0.6;
  }

  /**
   * Bomb Blast Airborne Explosion
   */
  private animateBombBlastAirborne(
    joints: HorseGenerator['joints'],
    racer: any,
    delta: number
  ) {
    const isAscending = racer.recoilVelocityY > 0;

    if (isAscending) {
      joints.torso.scale.set(0.65, 1.6, 0.65);
      joints.chest.scale.set(0.7, 1.5, 0.7);
      joints.rump.scale.set(0.7, 1.5, 0.7);
    } else {
      joints.torso.scale.set(1.38, 0.7, 1.38);
      joints.chest.scale.set(1.32, 0.75, 1.32);
      joints.rump.scale.set(1.32, 0.75, 1.32);
    }

    this.tumbleRotationX += delta * 13.5;
    this.tumbleRotationZ += delta * 9.0;
    if (this.generator.horseGroup) {
      this.generator.horseGroup.rotation.x = this.tumbleRotationX;
      this.generator.horseGroup.rotation.z = this.tumbleRotationZ;
    }

    joints.neckPivot.rotation.x = 0.8 + Math.sin(this.time * 16) * 0.25;
    joints.headPivot.rotation.x = 0.7;
    joints.jawMesh.rotation.x = 0.45;

    const flailT = this.time * 22.0;
    joints.frontLeft.shoulder.rotation.set(
      Math.sin(flailT) * 1.4,
      0,
      Math.cos(flailT) * 0.4
    );
    joints.frontRight.shoulder.rotation.set(
      Math.sin(flailT + Math.PI * 0.5) * 1.4,
      0,
      -Math.cos(flailT) * 0.4
    );

    joints.backLeft.hip.rotation.set(
      Math.sin(flailT + Math.PI) * 1.4,
      0,
      Math.cos(flailT + 1) * 0.4
    );
    joints.backRight.hip.rotation.set(
      Math.sin(flailT + Math.PI * 1.5) * 1.4,
      0,
      -Math.cos(flailT + 1) * 0.4
    );

    joints.frontLeft.knee.rotation.set(0.9 + Math.sin(flailT * 1.4) * 0.5, 0, 0);
    joints.frontRight.knee.rotation.set(0.9 + Math.cos(flailT * 1.4) * 0.5, 0, 0);
    joints.backLeft.hock.rotation.set(-0.9 - Math.sin(flailT * 1.4) * 0.5, 0, 0);
    joints.backRight.hock.rotation.set(-0.9 - Math.cos(flailT * 1.4) * 0.5, 0, 0);

    joints.tailPivot.rotation.set(0.2, 0, Math.sin(flailT) * 0.6);
  }

  /**
   * Winner Rearing celebration
   */
  private animateRear(joints: HorseGenerator['joints'], delta: number) {
    const t = this.time * 2.5;

    const rearPitch = -0.8 + Math.sin(t * 0.5) * 0.08;
    joints.spine.rotation.x = rearPitch;
    joints.spine.position.y = this.generator.baseSpineY + 0.6 + Math.sin(t) * 0.1;

    joints.torso.scale.set(0.95, 1.15, 0.95);
    joints.chest.scale.set(1.1, 1.1, 1.1);

    joints.frontLeft.shoulder.rotation.set(-1.2 + Math.sin(t * 3) * 0.4, 0, 0.2);
    joints.frontLeft.knee.rotation.set(1.1 + Math.sin(t * 3) * 0.2, 0, 0);

    joints.frontRight.shoulder.rotation.set(-1.0 + Math.sin(t * 3 + Math.PI / 2) * 0.4, 0, -0.2);
    joints.frontRight.knee.rotation.set(1.1 + Math.sin(t * 3 + Math.PI / 2) * 0.2, 0, 0);

    joints.backLeft.hip.rotation.set(0.4, 0, 0);
    joints.backLeft.hock.rotation.set(-0.3, 0, 0);
    joints.backRight.hip.rotation.set(0.4, 0, 0);
    joints.backRight.hock.rotation.set(-0.3, 0, 0);

    joints.neckPivot.rotation.x = -0.5 + Math.sin(t) * 0.1;
    joints.headPivot.rotation.x = 0.2;

    joints.tailPivot.rotation.x = -1.0;
  }
}
