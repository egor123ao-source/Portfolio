import * as THREE from '/vendor/three/three.module.js';
import { haloTexture } from './textures.js';
import { ROAD_WIDTH } from './road.js';

const SPACING = 26;
const LEFT_SPACING = 78;
const POST_HEIGHT = 6.6;
const LAMP_OFFSET = ROAD_WIDTH / 2 + 1.5;
const SPAN = 540;

export class LampRow {
  constructor() {
    this.group = new THREE.Group();
    this.night = 0;
    this.target = 0;
    this.lamps = [];

    const postGeometry = new THREE.CylinderGeometry(0.075, 0.11, POST_HEIGHT, 8);
    const armGeometry = new THREE.CylinderGeometry(0.055, 0.055, 1.5, 6);
    const headGeometry = new THREE.BoxGeometry(0.62, 0.16, 0.3);
    const postMaterial = new THREE.MeshStandardMaterial({ color: '#4a5563', roughness: 0.55, metalness: 0.45 });
    const halo = haloTexture();

    const makeLamp = (z, side) => {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      const arm = new THREE.Mesh(armGeometry, postMaterial);
      const head = new THREE.Mesh(headGeometry, new THREE.MeshStandardMaterial({
        color: '#2f3843',
        emissive: new THREE.Color('#ffb45c'),
        emissiveIntensity: 0,
        roughness: 0.4,
      }));
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: halo,
        color: '#ffbe74',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }));

      const headX = side * -1.05;
      const postX = side * LAMP_OFFSET;
      post.position.set(0, POST_HEIGHT / 2, 0);
      arm.position.set(headX / 2, POST_HEIGHT - 0.16, 0);
      arm.rotation.z = Math.PI / 2;
      head.position.set(headX, POST_HEIGHT - 0.26, 0);
      glow.position.set(headX, POST_HEIGHT - 0.2, 0);
      glow.scale.set(6.5, 6.5, 1);

      const lamp = new THREE.Group();
      lamp.position.set(postX, 0, z);
      lamp.add(post, arm, head, glow);
      this.group.add(lamp);
      this.lamps.push({ group: lamp, head, glow, x: postX + headX, z, intensity: 0 });
      return lamp;
    };

    for (let z = -13; z > -SPAN; z -= SPACING) makeLamp(z, -1);
    for (let z = -52; z > -SPAN; z -= LEFT_SPACING) makeLamp(z, 1);

    this.lamps.sort((a, b) => b.z - a.z);
    this.postMaterial = postMaterial;
  }

  setNight(value) {
    this.target = value;
  }

  step(dt) {
    const speed = Math.min(1, dt * 1.8);
    this.night += (this.target - this.night) * speed;
    for (const lamp of this.lamps) {
      lamp.head.material.emissiveIntensity = this.night * 2.4;
      lamp.head.material.color.setScalar(0.22 + this.night * 0.55);
      lamp.glow.material.opacity = this.night * 0.85;
      lamp.glow.scale.setScalar(5.4 + this.night * 1.6);
      lamp.intensity = this.night;
    }
  }

  // Lamps closest to the walker drive the point lights and the snow sparkle.
  nearestAhead(offsetZ, limit) {
    const result = [];
    for (const lamp of this.lamps) {
      const worldZ = lamp.z + offsetZ;
      if (worldZ > 6) continue;
      result.push({ x: lamp.x, z: worldZ, intensity: lamp.intensity });
      if (result.length >= limit) break;
    }
    return result;
  }
}
