import * as THREE from 'three';

export interface OutlineMaterialOptions {
  width?: number; // Base outline thickness in pixels / world units
  color?: string | number | THREE.Color;
  opacity?: number;
}

const INVERTED_HULL_VERTEX_SHADER = `
  uniform float uThickness;
  
  void main() {
    // Transform normal and position to view space
    vec3 transformedNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Scale expansion proportionally with depth so outline width stays constant
    float depthFactor = clamp(-mvPosition.z, 2.0, 180.0);
    float offset = uThickness * 0.0038 * (depthFactor * 0.15 + 0.85);
    
    // Push vertices along view-space normals
    mvPosition.xy += transformedNormal.xy * offset;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const INVERTED_HULL_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  
  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;

export function createOutlineMaterial(options: OutlineMaterialOptions = {}): THREE.ShaderMaterial {
  const {
    width = 1.4,
    color = '#05070a',
    opacity = 1.0,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: width },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    vertexShader: INVERTED_HULL_VERTEX_SHADER,
    fragmentShader: INVERTED_HULL_FRAGMENT_SHADER,
    side: THREE.BackSide,
    depthWrite: true,
    depthTest: true,
    transparent: opacity < 1.0,
  });
}
