import * as THREE from '/vendor/three/three.module.js';

const SKY_VERTEX = `
varying float vHeight;
void main() {
  vHeight = normalize(position).y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAGMENT = `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uGlow;
uniform float uGlowStrength;
varying float vHeight;
void main() {
  float t = smoothstep(-0.15, 0.62, vHeight);
  vec3 color = mix(uHorizon, uTop, t);
  float band = 1.0 - smoothstep(0.0, 0.24, abs(vHeight - 0.02));
  color = mix(color, uGlow, band * uGlowStrength);
  gl_FragColor = vec4(color, 1.0);
}`;

const DAY = {
  top: '#5f8cbe',
  horizon: '#dbe8f4',
  glow: '#fff2dd',
  fog: '#d7e3ef',
  hemiSky: '#cfe1f2',
  hemiGround: '#ffffff',
  hemi: 1.15,
  sun: '#fff3df',
  sunIntensity: 1.25,
  sunPosition: [-26, 34, -18],
};

const NIGHT = {
  top: '#050a12',
  horizon: '#18242f',
  glow: '#ffb96a',
  fog: '#0a1119',
  hemiSky: '#1d3149',
  hemiGround: '#070b11',
  hemi: 0.42,
  sun: '#a9c6e8',
  sunIntensity: 0.32,
  sunPosition: [22, 30, 16],
};

const dayTop = new THREE.Color(DAY.top);
const dayHorizon = new THREE.Color(DAY.horizon);
const dayGlow = new THREE.Color(DAY.glow);
const dayFog = new THREE.Color(DAY.fog);
const dayHemiSky = new THREE.Color(DAY.hemiSky);
const dayHemiGround = new THREE.Color(DAY.hemiGround);
const daySun = new THREE.Color(DAY.sun);

const nightTop = new THREE.Color(NIGHT.top);
const nightHorizon = new THREE.Color(NIGHT.horizon);
const nightGlow = new THREE.Color(NIGHT.glow);
const nightFog = new THREE.Color(NIGHT.fog);
const nightHemiSky = new THREE.Color(NIGHT.hemiSky);
const nightHemiGround = new THREE.Color(NIGHT.hemiGround);
const nightSun = new THREE.Color(NIGHT.sun);

export class Sky {
  constructor(scene, { fogNear, fogFar }) {
    this.target = 0;
    this.mix = 0;
    this.fog = new THREE.Fog(dayFog.clone(), fogNear, fogFar);
    scene.fog = this.fog;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: dayTop.clone() },
        uHorizon: { value: dayHorizon.clone() },
        uGlow: { value: dayGlow.clone() },
        uGlowStrength: { value: 0.35 },
      },
      vertexShader: SKY_VERTEX,
      fragmentShader: SKY_FRAGMENT,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), this.material);
    scene.add(this.dome);

    this.hemisphere = new THREE.HemisphereLight(dayHemiSky.clone(), dayHemiGround.clone(), DAY.hemi);
    this.sun = new THREE.DirectionalLight(daySun.clone(), DAY.sunIntensity);
    this.sun.position.set(DAY.sunPosition[0], DAY.sunPosition[1], DAY.sunPosition[2]);
    scene.add(this.hemisphere, this.sun);

    this.stars = this.createStars();
    scene.add(this.stars);
  }

  createStars() {
    const count = 700;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.88);
      const radius = 360;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.9 + 10;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: '#e7f1ff',
      size: 1.7,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    return new THREE.Points(geometry, material);
  }

  setNight(value) {
    this.target = value;
  }

  step(dt) {
    this.mix += (this.target - this.mix) * Math.min(1, dt * 1.6);
    const t = this.mix;
    const uniforms = this.material.uniforms;
    uniforms.uTop.value.copy(dayTop).lerp(nightTop, t);
    uniforms.uHorizon.value.copy(dayHorizon).lerp(nightHorizon, t);
    uniforms.uGlow.value.copy(dayGlow).lerp(nightGlow, t);
    uniforms.uGlowStrength.value = 0.35 + t * 0.45;

    this.fog.color.copy(dayFog).lerp(nightFog, t);
    this.hemisphere.color.copy(dayHemiSky).lerp(nightHemiSky, t);
    this.hemisphere.groundColor.copy(dayHemiGround).lerp(nightHemiGround, t);
    this.hemisphere.intensity = DAY.hemi + (NIGHT.hemi - DAY.hemi) * t;
    this.sun.color.copy(daySun).lerp(nightSun, t);
    this.sun.intensity = DAY.sunIntensity + (NIGHT.sunIntensity - DAY.sunIntensity) * t;
    this.sun.position.set(
      DAY.sunPosition[0] + (NIGHT.sunPosition[0] - DAY.sunPosition[0]) * t,
      DAY.sunPosition[1] + (NIGHT.sunPosition[1] - DAY.sunPosition[1]) * t,
      DAY.sunPosition[2] + (NIGHT.sunPosition[2] - DAY.sunPosition[2]) * t,
    );
    this.stars.material.opacity = Math.max(0, t - 0.32) * 1.5;
    this.stars.rotation.y += dt * 0.004;
  }
}
