import * as THREE from '/vendor/three/three.module.js';
import { asphaltTexture, snowTexture } from './textures.js';

export const ROAD_WIDTH = 7.4;
export const PANEL_LENGTH = 260;
export const WALK_X = 1.55;
const VERGE_WIDTH = 22;

export function buildGround(random) {
  const group = new THREE.Group();
  const snowMap = snowTexture(random);
  snowMap.repeat.set(VERGE_WIDTH / 6, PANEL_LENGTH / 6);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(VERGE_WIDTH, PANEL_LENGTH),
    new THREE.MeshStandardMaterial({ map: snowMap, color: '#eaf1f8', roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.02, -PANEL_LENGTH / 2);
  group.add(ground);

  const farField = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({ color: '#d8e3ef', roughness: 1, metalness: 0 }),
  );
  farField.rotation.x = -Math.PI / 2;
  farField.position.set(0, -0.12, -PANEL_LENGTH / 2);
  group.add(farField);

  return group;
}

function buildRoad(random) {
  const map = asphaltTexture(random);
  map.repeat.set(1, PANEL_LENGTH / 11);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_WIDTH, PANEL_LENGTH),
    new THREE.MeshStandardMaterial({ map, color: '#ffffff', roughness: 0.62, metalness: 0.03 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.012, -PANEL_LENGTH / 2);
  return road;
}

// Ploughed banks keep the eye on the road and hide the verge seam.
function buildBanks(random) {
  const group = new THREE.Group();
  const map = snowTexture(random);
  map.repeat.set(3, PANEL_LENGTH / 5);
  const material = new THREE.MeshStandardMaterial({ map, color: '#f2f7fc', roughness: 0.9 });

  for (const side of [-1, 1]) {
    const bank = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.92, PANEL_LENGTH, 8, 1, true), material);
    bank.rotation.x = Math.PI / 2;
    bank.rotation.z = Math.PI / 8;
    bank.position.set(side * (ROAD_WIDTH / 2 + 0.5), -0.28, -PANEL_LENGTH / 2);
    group.add(bank);
  }
  return group;
}

export function buildRoadSurface(random) {
  const group = new THREE.Group();
  group.add(buildRoad(random));
  group.add(buildBanks(random));
  return group;
}
