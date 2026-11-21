import * as THREE from '/vendor/three/three.module.js';

const SPAN = 540;
const MIN_DISTANCE = 9.5;
const MAX_DISTANCE = 46;

export function buildForest({ random, count }) {
  const group = new THREE.Group();
  const trunkGeometry = new THREE.CylinderGeometry(0.11, 0.2, 2.2, 5);
  const canopyGeometry = new THREE.ConeGeometry(1, 3, 7);
  const crownGeometry = new THREE.ConeGeometry(0.72, 2.1, 7);

  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#3a3330', roughness: 0.9 });
  const canopyMaterial = new THREE.MeshStandardMaterial({ color: '#2c3f43', roughness: 0.85 });
  const crownMaterial = new THREE.MeshStandardMaterial({ color: '#dfeaf4', roughness: 0.75 });

  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
  const canopies = new THREE.InstancedMesh(canopyGeometry, canopyMaterial, count);
  const crowns = new THREE.InstancedMesh(crownGeometry, crownMaterial, count);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const side = random() > 0.5 ? 1 : -1;
    const distance = MIN_DISTANCE + random() * (MAX_DISTANCE - MIN_DISTANCE);
    const x = side * distance;
    const z = -random() * SPAN;
    const height = 2.4 + random() * 4.2;
    const width = 0.75 + random() * 0.75;
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI);

    position.set(x, 1.1 * height * 0.32, z);
    scale.set(width, height * 0.32, width);
    trunks.setMatrixAt(i, matrix.compose(position, quaternion, scale));

    position.set(x, height * 1.35, z);
    scale.set(width, height, width);
    canopies.setMatrixAt(i, matrix.compose(position, quaternion, scale));

    position.set(x, height * 2.1, z);
    scale.set(width, height * 0.75, width);
    crowns.setMatrixAt(i, matrix.compose(position, quaternion, scale));
  }

  trunks.instanceMatrix.needsUpdate = true;
  canopies.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  group.add(trunks, canopies, crowns);
  return group;
}
