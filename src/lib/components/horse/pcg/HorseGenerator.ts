import * as THREE from 'three';
import type { HorseAttributes, PatternType } from '../types';

export class HorseGenerator {
  public containerGroup: THREE.Group;
  public horseGroup: THREE.Group;

  // Skeletal Pivot Nodes for procedural animation
  public joints: {
    spine: THREE.Group;
    torso: THREE.Mesh;
    chest: THREE.Mesh;
    rump: THREE.Mesh;
    withers: THREE.Mesh;
    neckPivot: THREE.Group;
    neckMesh: THREE.Mesh;
    headPivot: THREE.Group;
    headMesh: THREE.Mesh;
    jawMesh: THREE.Mesh;
    muzzleMesh: THREE.Mesh;
    earLeft: THREE.Group;
    earRight: THREE.Group;
    tailPivot: THREE.Group;
    tailSegments: THREE.Mesh[];

    // Front Legs
    frontLeft: {
      shoulder: THREE.Group;
      upperLeg: THREE.Mesh;
      knee: THREE.Group;
      lowerLeg: THREE.Mesh;
      hoof: THREE.Mesh;
    };
    frontRight: {
      shoulder: THREE.Group;
      upperLeg: THREE.Mesh;
      knee: THREE.Group;
      lowerLeg: THREE.Mesh;
      hoof: THREE.Mesh;
    };

    // Back Legs
    backLeft: {
      hip: THREE.Group;
      upperLeg: THREE.Mesh;
      hock: THREE.Group;
      lowerLeg: THREE.Mesh;
      hoof: THREE.Mesh;
    };
    backRight: {
      hip: THREE.Group;
      upperLeg: THREE.Mesh;
      hock: THREE.Group;
      lowerLeg: THREE.Mesh;
      hoof: THREE.Mesh;
    };

    // Hair details
    maneTufts: THREE.Mesh[];
  };

  // Base Y height calculated from leg scale
  public baseSpineY: number = 1.95;

  // Materials
  private coatMaterial: THREE.MeshStandardMaterial;
  private accentMaterial: THREE.MeshStandardMaterial;
  private maneMaterial: THREE.MeshStandardMaterial;
  private hoofMaterial: THREE.MeshStandardMaterial;
  private eyeMaterial: THREE.MeshStandardMaterial;
  private patternCanvas: HTMLCanvasElement;
  private patternTexture: THREE.CanvasTexture;

  constructor() {
    this.containerGroup = new THREE.Group();
    this.horseGroup = new THREE.Group();
    this.containerGroup.add(this.horseGroup);

    // Canvas texture for coat patterns (Pinto/Dapple/Socks)
    this.patternCanvas = document.createElement('canvas');
    this.patternCanvas.width = 512;
    this.patternCanvas.height = 512;
    this.patternTexture = new THREE.CanvasTexture(this.patternCanvas);
    this.patternTexture.wrapS = THREE.RepeatWrapping;
    this.patternTexture.wrapT = THREE.RepeatWrapping;
    this.patternTexture.repeat.set(2, 1);

    // Materials initialization
    this.coatMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2314,
      roughness: 0.45,
      metalness: 0.08,
      map: this.patternTexture
    });

    this.accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6ded8,
      roughness: 0.55,
      metalness: 0.05
    });

    this.maneMaterial = new THREE.MeshStandardMaterial({
      color: 0x170f0a,
      roughness: 0.75,
      metalness: 0.1
    });

    this.hoofMaterial = new THREE.MeshStandardMaterial({
      color: 0x221d19,
      roughness: 0.35,
      metalness: 0.2
    });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x050508,
      roughness: 0.1,
      metalness: 0.9
    });

    // Build skeletal hierarchy
    this.joints = this.buildHorseMesh();
  }

  private buildHorseMesh() {
    const spine = new THREE.Group();
    spine.name = "spine";
    this.horseGroup.add(spine);

    // 1. Cohesive Muscular Body Frame (Chest -> Barrel -> Rump -> Withers)
    // Main Torso Barrel
    const torsoGeo = new THREE.CylinderGeometry(0.52, 0.58, 1.7, 24);
    torsoGeo.rotateX(Math.PI / 2);
    const torso = new THREE.Mesh(torsoGeo, this.coatMaterial);
    torso.position.set(0, 0.0, 0.0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    spine.add(torso);

    // Deep Muscular Chest (Front)
    const chestGeo = new THREE.SphereGeometry(0.6, 24, 24);
    const chest = new THREE.Mesh(chestGeo, this.coatMaterial);
    chest.position.set(0, -0.02, -0.82);
    chest.scale.set(0.88, 1.08, 1.1);
    chest.castShadow = true;
    chest.receiveShadow = true;
    spine.add(chest);

    // Withers (Shoulder Hump connecting spine to neck base)
    const withersGeo = new THREE.SphereGeometry(0.48, 20, 20);
    const withers = new THREE.Mesh(withersGeo, this.coatMaterial);
    withers.position.set(0, 0.42, -0.5);
    withers.scale.set(0.82, 0.98, 1.15);
    withers.castShadow = true;
    spine.add(withers);

    // Rump / Croup (Hindquarters back)
    const rumpGeo = new THREE.SphereGeometry(0.62, 24, 24);
    const rump = new THREE.Mesh(rumpGeo, this.coatMaterial);
    rump.position.set(0, 0.06, 0.78);
    rump.scale.set(0.92, 1.05, 0.95);
    rump.castShadow = true;
    rump.receiveShadow = true;
    spine.add(rump);

    // 2. Neck & Head (MOVED FAR FORWARD TO FRONT BREASTPLATE z = -1.15)
    const neckPivot = new THREE.Group();
    neckPivot.position.set(0, -0.1, -1.15); // Far forward at front breastplate!
    spine.add(neckPivot);

    // Sculpted, Tapered Neck extending FORWARD & UPWARD
    const neckGeo = new THREE.CylinderGeometry(0.28, 0.52, 1.5, 20);
    const neckMesh = new THREE.Mesh(neckGeo, this.coatMaterial);
    neckMesh.position.set(0, 0.65, -0.15); // Negative Z extends forward!
    neckMesh.rotation.x = -Math.PI / 4.2;  // Upward & forward angle
    neckMesh.scale.set(0.8, 1.0, 1.15);
    neckMesh.castShadow = true;
    neckMesh.receiveShadow = true;
    neckPivot.add(neckMesh);

    // Mane along TOP CREST of neck (from throat/poll to withers)
    const maneTufts: THREE.Mesh[] = [];
    const numTufts = 8;
    for (let i = 0; i < numTufts; i++) {
      const tuftGeo = new THREE.BoxGeometry(0.08, 0.25, 0.25);
      const tuft = new THREE.Mesh(tuftGeo, this.maneMaterial);
      const t = i / (numTufts - 1);
      // Positioned along top ridge of neck
      tuft.position.set(0, 0.75 - (t * 0.8), -0.05 + (t * 0.35));
      tuft.rotation.x = -Math.PI / 4.2 + 0.1;
      tuft.rotation.z = (Math.random() - 0.5) * 0.04;
      tuft.castShadow = true;
      neckPivot.add(tuft);
      maneTufts.push(tuft);
    }

    // 3. Head & Snout (Far forward in front of body z = -1.45)
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.35, -0.35);
    neckPivot.add(headPivot);

    // Main Skull / Forehead (tapering downwards)
    const headGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.58, 16);
    const headMesh = new THREE.Mesh(headGeo, this.coatMaterial);
    headMesh.position.set(0, -0.05, -0.22);
    headMesh.rotation.x = Math.PI / 3.6; // Angle downwards along nose line (~50 deg)
    headMesh.scale.set(1.1, 1.0, 1.2);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headPivot.add(headMesh);

    // Nose Bridge & Muzzle (smoothly continuous with head line)
    const muzzleGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.45, 16);
    const muzzleMesh = new THREE.Mesh(muzzleGeo, this.coatMaterial);
    muzzleMesh.position.set(0, -0.25, -0.52);
    muzzleMesh.rotation.x = Math.PI / 3.4;
    muzzleMesh.scale.set(0.95, 1.0, 1.1);
    muzzleMesh.castShadow = true;
    headPivot.add(muzzleMesh);

    // Muscular Ganache / Cheek Plates
    const cheekGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const leftCheek = new THREE.Mesh(cheekGeo, this.coatMaterial);
    leftCheek.position.set(0.13, -0.05, -0.18);
    leftCheek.scale.set(0.55, 1.0, 1.25);
    const rightCheek = new THREE.Mesh(cheekGeo, this.coatMaterial);
    rightCheek.position.set(-0.13, -0.05, -0.18);
    rightCheek.scale.set(0.55, 1.0, 1.25);
    headPivot.add(leftCheek, rightCheek);

    // Jaw / Throatlatch Connection
    const jawGeo = new THREE.BoxGeometry(0.24, 0.16, 0.42);
    const jawMesh = new THREE.Mesh(jawGeo, this.coatMaterial);
    jawMesh.position.set(0, -0.12, -0.2);
    jawMesh.rotation.x = Math.PI / 3.6;
    headPivot.add(jawMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.095, 12, 12);
    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    leftEye.position.set(0.17, 0.05, -0.24);
    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    rightEye.position.set(-0.17, 0.05, -0.24);
    headPivot.add(leftEye, rightEye);

    // Realistic Equine Ears
    const createEar = (isLeft: boolean) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(isLeft ? 0.11 : -0.11, 0.22, -0.06);

      const earGeo = new THREE.CylinderGeometry(0.02, 0.065, 0.28, 10);
      const earMesh = new THREE.Mesh(earGeo, this.coatMaterial);
      earMesh.position.set(0, 0.12, 0);
      earMesh.scale.set(0.45, 1.0, 1.1);
      earMesh.rotation.x = 0.15;
      earMesh.rotation.z = isLeft ? -0.15 : 0.15;
      earMesh.castShadow = true;
      earGroup.add(earMesh);

      return earGroup;
    };

    const earLeft = createEar(true);
    const earRight = createEar(false);
    headPivot.add(earLeft, earRight);

    // 4. Tail Group (CONNECTED TIGHTLY WITH ZERO FLOATING GAPS)
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.62, 1.08); // High croup dock
    tailPivot.rotation.x = -0.68;          // Angled BACKWARD away from body
    spine.add(tailPivot);

    const tailSegments: THREE.Mesh[] = [];
    const segConfigs = [
      { rTop: 0.12, rBot: 0.16, h: 0.5, rx: -0.12 },
      { rTop: 0.16, rBot: 0.15, h: 0.55, rx: 0.18 },
      { rTop: 0.15, rBot: 0.11, h: 0.55, rx: 0.2 },
      { rTop: 0.11, rBot: 0.03, h: 0.45, rx: 0.15 }
    ];

    let currentParent: THREE.Group | THREE.Mesh = tailPivot;
    segConfigs.forEach((cfg, i) => {
      const segGeo = new THREE.CylinderGeometry(cfg.rTop, cfg.rBot, cfg.h, 14);
      const segMesh = new THREE.Mesh(segGeo, this.maneMaterial);
      segMesh.position.set(0, i === 0 ? -cfg.h * 0.4 : -cfg.h * 0.8, 0);
      segMesh.rotation.x = cfg.rx;
      segMesh.castShadow = true;
      currentParent.add(segMesh);
      tailSegments.push(segMesh);

      currentParent = segMesh;
    });

    // 5. Anatomically Jointed Legs
    const createLeg = (isFront: boolean, isLeft: boolean) => {
      const xPos = isLeft ? 0.36 : -0.36;
      const zPos = isFront ? -0.7 : 0.7;

      const shoulder = new THREE.Group();
      shoulder.position.set(xPos, -0.12, zPos);
      spine.add(shoulder);

      // Shoulder / Hip Muscle Plate
      const plateGeo = new THREE.SphereGeometry(isFront ? 0.22 : 0.28, 12, 12);
      const plateMesh = new THREE.Mesh(plateGeo, this.coatMaterial);
      plateMesh.scale.set(0.6, 1.1, 0.9);
      shoulder.add(plateMesh);

      // Upper Leg (Forearm / Thigh)
      const upperGeo = new THREE.CylinderGeometry(isFront ? 0.17 : 0.22, 0.12, 0.88, 14);
      const upperLeg = new THREE.Mesh(upperGeo, this.coatMaterial);
      upperLeg.position.set(0, -0.45, 0);
      upperLeg.castShadow = true;
      upperLeg.receiveShadow = true;
      shoulder.add(upperLeg);

      // Knee / Hock Joint
      const knee = new THREE.Group();
      knee.position.set(0, -0.45, 0);
      upperLeg.add(knee);

      const kneeSphereGeo = new THREE.SphereGeometry(isFront ? 0.1 : 0.12, 10, 10);
      const kneeJointMesh = new THREE.Mesh(kneeSphereGeo, this.coatMaterial);
      knee.add(kneeJointMesh);

      // Lower Leg (Cannon bone)
      const lowerGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.85, 12);
      const lowerLeg = new THREE.Mesh(lowerGeo, this.coatMaterial);
      lowerLeg.position.set(0, -0.42, 0);
      lowerLeg.castShadow = true;
      lowerLeg.receiveShadow = true;
      knee.add(lowerLeg);

      // Hoof & Angled Pastern
      const hoofGeo = new THREE.CylinderGeometry(0.085, 0.13, 0.22, 12);
      const hoof = new THREE.Mesh(hoofGeo, this.hoofMaterial);
      hoof.position.set(0, -0.45, 0.03);
      hoof.rotation.x = 0.16;
      hoof.castShadow = true;
      lowerLeg.add(hoof);

      if (isFront) {
        return { shoulder, upperLeg, knee, lowerLeg, hoof };
      } else {
        return { hip: shoulder, upperLeg, hock: knee, lowerLeg, hoof };
      }
    };

    const frontLeft = createLeg(true, true) as { shoulder: THREE.Group; upperLeg: THREE.Mesh; knee: THREE.Group; lowerLeg: THREE.Mesh; hoof: THREE.Mesh };
    const frontRight = createLeg(true, false) as { shoulder: THREE.Group; upperLeg: THREE.Mesh; knee: THREE.Group; lowerLeg: THREE.Mesh; hoof: THREE.Mesh };
    const backLeft = createLeg(false, true) as { hip: THREE.Group; upperLeg: THREE.Mesh; hock: THREE.Group; lowerLeg: THREE.Mesh; hoof: THREE.Mesh };
    const backRight = createLeg(false, false) as { hip: THREE.Group; upperLeg: THREE.Mesh; hock: THREE.Group; lowerLeg: THREE.Mesh; hoof: THREE.Mesh };

    // Ground alignment base
    spine.position.y = 1.95;

    return {
      spine,
      torso,
      chest,
      rump,
      withers,
      neckPivot,
      neckMesh,
      headPivot,
      headMesh,
      jawMesh,
      muzzleMesh,
      earLeft,
      earRight,
      tailPivot,
      tailSegments,
      frontLeft,
      frontRight,
      backLeft,
      backRight,
      maneTufts
    };
  }

  private lastPatternType: PatternType | null = null;
  private lastCoatHex: string | null = null;
  private lastPatternHex: string | null = null;

  public updateAttributes(attrs: HorseAttributes) {
    // 1. Update Materials & Colors
    const coatColorHex = new THREE.Color(attrs.coatColor);
    const patternColorHex = new THREE.Color(attrs.patternColor);
    const maneColorHex = new THREE.Color(attrs.maneColor);
    const hoofColorHex = new THREE.Color(attrs.hoofColor);

    this.coatMaterial.color.copy(coatColorHex);
    this.accentMaterial.color.copy(patternColorHex);
    this.maneMaterial.color.copy(maneColorHex);
    this.hoofMaterial.color.copy(hoofColorHex);

    // Coat Sheen (roughness / metalness)
    const sheenNorm = (attrs.coatSheen || 0) / 100;
    this.coatMaterial.roughness = 0.85 - (sheenNorm * 0.4);
    this.coatMaterial.metalness = sheenNorm * 0.3;

    // 2. Draw Procedural Pattern Canvas (only if pattern/colors changed)
    if (
      this.lastPatternType !== attrs.patternType ||
      this.lastCoatHex !== attrs.coatColor ||
      this.lastPatternHex !== attrs.patternColor
    ) {
      this.updatePatternCanvas(attrs.patternType, attrs.coatColor, attrs.patternColor);
      this.lastPatternType = attrs.patternType;
      this.lastCoatHex = attrs.coatColor;
      this.lastPatternHex = attrs.patternColor;
    }

    // 3. Parametric Geometry & Morphing
    const heightScale = 0.82 + (attrs.height / 100) * 0.36;
    const speedScale = 0.9 + (attrs.speed / 100) * 0.2;
    const staminaScale = 0.9 + (attrs.stamina / 100) * 0.25;
    const eleganceScale = 0.85 + (attrs.elegance / 100) * 0.3;

    // Scale entire horse group height
    this.horseGroup.scale.set(heightScale, heightScale, heightScale);

    // Torso thickness (stamina barrel size)
    this.joints.torso.scale.set(1.0, staminaScale, 1.0 + (staminaScale - 1) * 0.4);
    this.joints.chest.scale.set(staminaScale, staminaScale, 1.05 * staminaScale);

    // Neck arch & length (elegance)
    this.joints.neckPivot.scale.set(1.0, eleganceScale, 1.0);

    // Head posture (aggression)
    const aggressionNorm = attrs.aggression / 100;
    this.joints.headPivot.rotation.x = 0.1 - (aggressionNorm * 0.2);

    // Legs athletic length (speed & height)
    const legLengthScale = 0.9 + (attrs.speed / 100) * 0.22;
    const legThickness = 1.1 - (attrs.elegance / 100) * 0.25;

    [this.joints.frontLeft, this.joints.frontRight, this.joints.backLeft, this.joints.backRight].forEach(leg => {
      leg.upperLeg.scale.set(legThickness, legLengthScale, legThickness);
      leg.lowerLeg.scale.set(legThickness * 0.9, legLengthScale, legThickness * 0.9);
    });

    // Re-align spine ground height
    this.baseSpineY = 1.95 * legLengthScale;
    this.joints.spine.position.y = this.baseSpineY;
  }

  private updatePatternCanvas(pattern: PatternType, coatHex: string, patternHex: string) {
    const ctx = this.patternCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = coatHex;
    ctx.fillRect(0, 0, 512, 512);

    if (pattern === 'solid') {
      this.patternTexture.needsUpdate = true;
      return;
    }

    ctx.fillStyle = patternHex;

    if (pattern === 'pinto') {
      // Organic pinto patches
      ctx.beginPath();
      ctx.ellipse(120, 140, 90, 60, Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(360, 240, 80, 110, Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(200, 380, 110, 70, -Math.PI / 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (pattern === 'dappled') {
      // Dappled ring spots
      for (let x = 30; x < 512; x += 50) {
        for (let y = 30; y < 512; y += 50) {
          ctx.beginPath();
          ctx.arc(x + (Math.random() * 16 - 8), y + (Math.random() * 16 - 8), 12, 0, Math.PI * 2);
          ctx.globalAlpha = 0.5;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
    } else if (pattern === 'socks') {
      ctx.fillRect(0, 400, 512, 112);
      ctx.fillRect(0, 0, 512, 64);
    } else if (pattern === 'metallic') {
      ctx.strokeStyle = patternHex;
      ctx.lineWidth = 10;
      for (let i = 0; i < 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 256, 512);
        ctx.stroke();
      }
    }

    this.patternTexture.needsUpdate = true;
  }

  public dispose() {
    if (this.patternTexture) {
      this.patternTexture.dispose();
    }
    this.coatMaterial?.dispose();
    this.accentMaterial?.dispose();
    this.maneMaterial?.dispose();
    this.hoofMaterial?.dispose();
    this.eyeMaterial?.dispose();

    this.containerGroup?.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m?.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });

    this.horseGroup?.clear();
    this.containerGroup?.clear();
  }
}
