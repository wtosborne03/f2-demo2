import * as THREE from 'three';
import type { HorseAttributes, PatternType } from '../types';
import { getStepped3ToonRamp, GAMEPLAY_PALETTE } from '../materials/toonPalette';
import { createOutlineMaterial } from '../materials/InvertedHullOutline';

export class HorseGenerator {
  public containerGroup: THREE.Group;
  public horseGroup: THREE.Group;

  // Skeletal Pivot Nodes for procedural animation
  public joints!: {
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

  // Bright Stylized Toon Materials
  private coatMaterial: THREE.MeshToonMaterial;
  private accentMaterial: THREE.MeshToonMaterial;
  private maneMaterial: THREE.MeshToonMaterial;
  private hoofMaterial: THREE.MeshToonMaterial;
  private eyeMaterial: THREE.MeshToonMaterial;
  private outlineMaterial: THREE.ShaderMaterial;
  private patternCanvas: HTMLCanvasElement;
  private patternTexture: THREE.CanvasTexture;

  constructor() {
    this.containerGroup = new THREE.Group();
    this.horseGroup = new THREE.Group();
    this.containerGroup.add(this.horseGroup);

    // Canvas texture for coat patterns (Pinto/Dapple/Socks/Metallic)
    this.patternCanvas = document.createElement('canvas');
    this.patternCanvas.width = 512;
    this.patternCanvas.height = 512;
    this.patternTexture = new THREE.CanvasTexture(this.patternCanvas);
    this.patternTexture.wrapS = THREE.RepeatWrapping;
    this.patternTexture.wrapT = THREE.RepeatWrapping;
    this.patternTexture.repeat.set(2, 1);

    const toonGradient = getStepped3ToonRamp();
    this.outlineMaterial = createOutlineMaterial({ width: 1.4, color: GAMEPLAY_PALETTE.outlineColor });

    // High-Contrast Stepped Cel Materials
    this.coatMaterial = new THREE.MeshToonMaterial({
      color: 0x6b3d1b,
      map: this.patternTexture,
      gradientMap: toonGradient,
      emissive: new THREE.Color(0x6b3d1b).multiplyScalar(0.25),
    });

    this.accentMaterial = new THREE.MeshToonMaterial({
      color: 0xf5eee6,
      gradientMap: toonGradient,
      emissive: new THREE.Color(0xf5eee6).multiplyScalar(0.2),
    });

    this.maneMaterial = new THREE.MeshToonMaterial({
      color: 0x241810,
      gradientMap: toonGradient,
      emissive: new THREE.Color(0x241810).multiplyScalar(0.25),
    });

    this.hoofMaterial = new THREE.MeshToonMaterial({
      color: 0x2b2420,
      gradientMap: toonGradient,
      emissive: new THREE.Color(0x2b2420).multiplyScalar(0.2),
    });

    this.eyeMaterial = new THREE.MeshToonMaterial({
      color: 0x050508,
      emissive: new THREE.Color(0x111118),
    });

    // Build skeletal hierarchy with attached inverted-hull outline meshes
    this.joints = this.buildHorseMesh();
  }

  private addOutlinedMesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, addOutline = true): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    if (addOutline) {
      const outline = new THREE.Mesh(geometry, this.outlineMaterial);
      mesh.add(outline);
    }
    parent.add(mesh);
    return mesh;
  }

  private buildHorseMesh() {
    const spine = new THREE.Group();
    spine.name = "spine";
    this.horseGroup.add(spine);

    // 1. Cohesive Muscular Body Frame
    const torsoGeo = new THREE.CylinderGeometry(0.52, 0.58, 1.7, 18);
    torsoGeo.rotateX(Math.PI / 2);
    const torso = this.addOutlinedMesh(torsoGeo, this.coatMaterial, spine);
    torso.position.set(0, 0.0, 0.0);

    const chestGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const chest = this.addOutlinedMesh(chestGeo, this.coatMaterial, spine);
    chest.position.set(0, -0.02, -0.82);
    chest.scale.set(0.88, 1.08, 1.1);

    const withersGeo = new THREE.SphereGeometry(0.48, 14, 14);
    const withers = this.addOutlinedMesh(withersGeo, this.coatMaterial, spine);
    withers.position.set(0, 0.42, -0.5);
    withers.scale.set(0.82, 0.98, 1.15);

    const rumpGeo = new THREE.SphereGeometry(0.62, 16, 16);
    const rump = this.addOutlinedMesh(rumpGeo, this.coatMaterial, spine);
    rump.position.set(0, 0.06, 0.78);
    rump.scale.set(0.92, 1.05, 0.95);

    // 2. Neck & Head
    const neckPivot = new THREE.Group();
    neckPivot.position.set(0, -0.1, -1.15);
    spine.add(neckPivot);

    const neckGeo = new THREE.CylinderGeometry(0.28, 0.52, 1.5, 14);
    const neckMesh = this.addOutlinedMesh(neckGeo, this.coatMaterial, neckPivot);
    neckMesh.position.set(0, 0.65, -0.15);
    neckMesh.rotation.x = -Math.PI / 4.2;
    neckMesh.scale.set(0.8, 1.0, 1.15);

    // Mane along TOP CREST of neck
    const maneTufts: THREE.Mesh[] = [];
    const numTufts = 8;
    for (let i = 0; i < numTufts; i++) {
      const tuftGeo = new THREE.BoxGeometry(0.08, 0.25, 0.25);
      const tuft = new THREE.Mesh(tuftGeo, this.maneMaterial);
      const t = i / (numTufts - 1);
      tuft.position.set(0, 0.75 - (t * 0.8), -0.05 + (t * 0.35));
      tuft.rotation.x = -Math.PI / 4.2 + 0.1;
      tuft.rotation.z = (Math.random() - 0.5) * 0.04;
      neckPivot.add(tuft);
      maneTufts.push(tuft);
    }

    // 3. Head & Muzzle
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.35, -0.35);
    neckPivot.add(headPivot);

    const headGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.58, 12);
    const headMesh = this.addOutlinedMesh(headGeo, this.coatMaterial, headPivot);
    headMesh.position.set(0, -0.05, -0.22);
    headMesh.rotation.x = Math.PI / 3.6;
    headMesh.scale.set(1.1, 1.0, 1.2);

    const muzzleGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.45, 12);
    const muzzleMesh = this.addOutlinedMesh(muzzleGeo, this.coatMaterial, headPivot);
    muzzleMesh.position.set(0, -0.25, -0.52);
    muzzleMesh.rotation.x = Math.PI / 3.4;
    muzzleMesh.scale.set(0.95, 1.0, 1.1);

    const cheekGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const leftCheek = new THREE.Mesh(cheekGeo, this.coatMaterial);
    leftCheek.position.set(0.13, -0.05, -0.18);
    leftCheek.scale.set(0.55, 1.0, 1.25);
    const rightCheek = new THREE.Mesh(cheekGeo, this.coatMaterial);
    rightCheek.position.set(-0.13, -0.05, -0.18);
    rightCheek.scale.set(0.55, 1.0, 1.25);
    headPivot.add(leftCheek, rightCheek);

    const jawGeo = new THREE.BoxGeometry(0.24, 0.16, 0.42);
    const jawMesh = new THREE.Mesh(jawGeo, this.coatMaterial);
    jawMesh.position.set(0, -0.12, -0.2);
    jawMesh.rotation.x = Math.PI / 3.6;
    headPivot.add(jawMesh);

    const eyeGeo = new THREE.SphereGeometry(0.095, 10, 10);
    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    leftEye.position.set(0.17, 0.05, -0.24);
    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    rightEye.position.set(-0.17, 0.05, -0.24);
    headPivot.add(leftEye, rightEye);

    const createEar = (isLeft: boolean) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(isLeft ? 0.11 : -0.11, 0.22, -0.06);

      const earGeo = new THREE.CylinderGeometry(0.02, 0.065, 0.28, 8);
      const earMesh = new THREE.Mesh(earGeo, this.coatMaterial);
      earMesh.position.set(0, 0.12, 0);
      earMesh.scale.set(0.45, 1.0, 1.1);
      earMesh.rotation.x = 0.15;
      earMesh.rotation.z = isLeft ? -0.15 : 0.15;
      earGroup.add(earMesh);

      return earGroup;
    };

    const earLeft = createEar(true);
    const earRight = createEar(false);
    headPivot.add(earLeft, earRight);

    // 4. Tail Group
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.62, 1.08);
    tailPivot.rotation.x = -0.68;
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
      const segGeo = new THREE.CylinderGeometry(cfg.rTop, cfg.rBot, cfg.h, 10);
      const segMesh = new THREE.Mesh(segGeo, this.maneMaterial);
      segMesh.position.set(0, i === 0 ? -cfg.h * 0.4 : -cfg.h * 0.8, 0);
      segMesh.rotation.x = cfg.rx;
      currentParent.add(segMesh);
      tailSegments.push(segMesh);

      currentParent = segMesh;
    });

    // 5. Jointed Legs
    const createLeg = (isFront: boolean, isLeft: boolean) => {
      const xPos = isLeft ? 0.36 : -0.36;
      const zPos = isFront ? -0.7 : 0.7;

      const shoulder = new THREE.Group();
      shoulder.position.set(xPos, -0.12, zPos);
      spine.add(shoulder);

      const plateGeo = new THREE.SphereGeometry(isFront ? 0.22 : 0.28, 10, 10);
      const plateMesh = new THREE.Mesh(plateGeo, this.coatMaterial);
      plateMesh.scale.set(0.6, 1.1, 0.9);
      shoulder.add(plateMesh);

      const upperGeo = new THREE.CylinderGeometry(isFront ? 0.17 : 0.22, 0.12, 0.88, 10);
      const upperLeg = this.addOutlinedMesh(upperGeo, this.coatMaterial, shoulder);
      upperLeg.position.set(0, -0.45, 0);

      const knee = new THREE.Group();
      knee.position.set(0, -0.45, 0);
      upperLeg.add(knee);

      const kneeSphereGeo = new THREE.SphereGeometry(isFront ? 0.1 : 0.12, 8, 8);
      const kneeJointMesh = new THREE.Mesh(kneeSphereGeo, this.coatMaterial);
      knee.add(kneeJointMesh);

      const lowerGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.85, 10);
      const lowerLeg = this.addOutlinedMesh(lowerGeo, this.coatMaterial, knee);
      lowerLeg.position.set(0, -0.42, 0);

      const hoofGeo = new THREE.CylinderGeometry(0.085, 0.13, 0.22, 10);
      const hoof = new THREE.Mesh(hoofGeo, this.hoofMaterial);
      hoof.position.set(0, -0.45, 0.03);
      hoof.rotation.x = 0.16;
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

  public updateAttributes(attrs: HorseAttributes) {
    const coatColorHex = new THREE.Color(attrs.coatColor);
    const patternColorHex = new THREE.Color(attrs.patternColor);
    const maneColorHex = new THREE.Color(attrs.maneColor);
    const hoofColorHex = new THREE.Color(attrs.hoofColor);

    this.coatMaterial.color.copy(coatColorHex);
    this.coatMaterial.emissive.copy(coatColorHex).multiplyScalar(0.25);

    this.accentMaterial.color.copy(patternColorHex);
    this.accentMaterial.emissive.copy(patternColorHex).multiplyScalar(0.2);

    this.maneMaterial.color.copy(maneColorHex);
    this.maneMaterial.emissive.copy(maneColorHex).multiplyScalar(0.25);

    this.hoofMaterial.color.copy(hoofColorHex);
    this.hoofMaterial.emissive.copy(hoofColorHex).multiplyScalar(0.2);

    // Draw Procedural Pattern Canvas
    this.updatePatternCanvas(attrs.patternType, attrs.coatColor, attrs.patternColor);

    // Parametric Geometry Morphing (height/agility, speed, stamina)
    const agilityVal = attrs.height ?? 50;
    const heightScale = 0.84 + (agilityVal / 100) * 0.32;
    const staminaScale = 0.9 + ((attrs.stamina ?? 50) / 100) * 0.25;
    const speedVal = (attrs.speed ?? 50) / 100;

    this.horseGroup.scale.set(heightScale, heightScale, heightScale);

    this.joints.torso.scale.set(1.0, staminaScale, 1.0 + (staminaScale - 1) * 0.4);
    this.joints.chest.scale.set(staminaScale, staminaScale, 1.05 * staminaScale);

    const legLengthScale = 0.9 + speedVal * 0.22;
    const legThickness = 1.05;

    [this.joints.frontLeft, this.joints.frontRight, this.joints.backLeft, this.joints.backRight].forEach(leg => {
      leg.upperLeg.scale.set(legThickness, legLengthScale, legThickness);
      leg.lowerLeg.scale.set(legThickness * 0.9, legLengthScale, legThickness * 0.9);
    });

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
      ctx.beginPath();
      ctx.ellipse(120, 140, 90, 60, Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(360, 240, 80, 110, Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(200, 380, 110, 70, -Math.PI / 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (pattern === 'dappled') {
      for (let x = 30; x < 512; x += 50) {
        for (let y = 30; y < 512; y += 50) {
          ctx.beginPath();
          ctx.arc(x + (Math.random() * 16 - 8), y + (Math.random() * 16 - 8), 14, 0, Math.PI * 2);
          ctx.globalAlpha = 0.6;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
    } else if (pattern === 'socks') {
      ctx.fillRect(0, 400, 512, 112);
      ctx.fillRect(0, 0, 512, 64);
    } else if (pattern === 'metallic') {
      ctx.strokeStyle = patternHex;
      ctx.lineWidth = 14;
      for (let i = 0; i < 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 256, 512);
        ctx.stroke();
      }
    }

    this.patternTexture.needsUpdate = true;
  }
}
