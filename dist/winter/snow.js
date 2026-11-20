import * as THREE from '/vendor/three/three.module.js';

const BOX_WIDTH = 58;
const BOX_DEPTH = 58;
const TOP = 19;
const BOTTOM = -1.4;

const vertexShader = `
uniform float uTime;
uniform float uPixelRatio;
uniform float uTop;
uniform float uBottom;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uLamps[3];
attribute float aSpeed;
attribute float aPhase;
attribute float aSize;
attribute float aSway;
varying float vGlow;
varying float vFog;
varying float vDepthAlpha;

void main() {
  float fall = fract(aPhase + uTime * aSpeed);
  float y = mix(uTop, uBottom, fall);
  float wind = sin(uTime * 0.42 + aPhase * 12.0) * aSway;
  vec3 p = vec3(position.x + wind, y, position.z + wind * 0.5);
  vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
  float depth = max(0.6, -viewPosition.z);
  gl_PointSize = clamp(aSize * uPixelRatio * 22.0 / depth, 1.0, 28.0);

  float glow = 0.0;
  for (int i = 0; i < 3; i++) {
    glow += uLamps[i].z * (1.0 - smoothstep(0.0, 11.0, distance(p.xz, uLamps[i].xy)));
  }
  vGlow = clamp(glow, 0.0, 1.6);
  vFog = smoothstep(uFogNear, uFogFar, depth);
  vDepthAlpha = smoothstep(0.0, 1.6, depth) * (0.34 + 0.66 * fall);
  gl_Position = projectionMatrix * viewPosition;
}`;

const fragmentShader = `
uniform vec3 uColor;
uniform vec3 uLampColor;
varying float vGlow;
varying float vFog;
varying float vDepthAlpha;

void main() {
  float radius = length(gl_PointCoord - 0.5);
  if (radius > 0.5) discard;
  float soft = smoothstep(0.5, 0.04, radius);
  float glow = clamp(vGlow, 0.0, 1.0);
  vec3 color = mix(uColor, uLampColor, glow);
  float alpha = soft * vDepthAlpha * (1.0 - vFog) * (0.5 + 0.6 * glow);
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(color, alpha);
}`;

export class Snowfall {
  constructor({ count, pixelRatio, fogNear, fogFar, random }) {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    const sways = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * BOX_WIDTH;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (random() - 0.5) * BOX_DEPTH;
      speeds[i] = 0.028 + random() * 0.062;
      phases[i] = random();
      sizes[i] = 0.7 + random() * 1.9;
      sways[i] = 0.15 + random() * 1.35;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSway', new THREE.BufferAttribute(sways, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uTop: { value: TOP },
        uBottom: { value: BOTTOM },
        uFogNear: { value: fogNear },
        uFogFar: { value: fogFar },
        uColor: { value: new THREE.Color('#ffffff') },
        uLampColor: { value: new THREE.Color('#ffcf92') },
        uLamps: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
  }

  // Lamps brighter than the sky make individual flakes readable at night.
  update(time, lamps) {
    this.material.uniforms.uTime.value = time;
    for (let i = 0; i < 3; i++) {
      const target = this.material.uniforms.uLamps.value[i];
      const lamp = lamps[i];
      if (lamp) target.set(lamp.x, lamp.z, lamp.intensity);
      else target.set(0, 0, 0);
    }
  }

  setTheme(theme) {
    const uniforms = this.material.uniforms;
    uniforms.uColor.value.set(theme === 'day' ? '#ffffff' : '#dde8f6');
    uniforms.uLampColor.value.set(theme === 'day' ? '#ffffff' : '#ffd39b');
  }

  setPixelRatio(pixelRatio) {
    this.material.uniforms.uPixelRatio.value = pixelRatio;
  }
}
