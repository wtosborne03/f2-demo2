import * as THREE from 'three';

// Singleton discrete DataTextures for stepped toon shading
let stepped3ToonRamp: THREE.DataTexture | null = null;
let stepped2ToonRamp: THREE.DataTexture | null = null;

export function getStepped3ToonRamp(): THREE.DataTexture {
  if (!stepped3ToonRamp) {
    const data = new Uint8Array([55, 170, 255]);
    stepped3ToonRamp = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
    stepped3ToonRamp.minFilter = THREE.NearestFilter;
    stepped3ToonRamp.magFilter = THREE.NearestFilter;
    stepped3ToonRamp.generateMipmaps = false;
    stepped3ToonRamp.needsUpdate = true;
  }
  return stepped3ToonRamp;
}

export function getStepped2ToonRamp(): THREE.DataTexture {
  if (!stepped2ToonRamp) {
    const data = new Uint8Array([80, 255]);
    stepped2ToonRamp = new THREE.DataTexture(data, 2, 1, THREE.RedFormat);
    stepped2ToonRamp.minFilter = THREE.NearestFilter;
    stepped2ToonRamp.magFilter = THREE.NearestFilter;
    stepped2ToonRamp.generateMipmaps = false;
    stepped2ToonRamp.needsUpdate = true;
  }
  return stepped2ToonRamp;
}

export const GAMEPLAY_PALETTE = {
  outlineColor: '#05070a',
  blobShadow: '#090d16',
};
