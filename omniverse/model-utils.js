import * as THREE from "three";

export const ink = new THREE.MeshBasicMaterial({ color: 0x08090d, side: THREE.BackSide });
export function toon(color, options = {}) {
  return new THREE.MeshToonMaterial({ color, ...options });
}
export function part(parent, geometry, material, position = [0,0,0], rotation = [0,0,0], scale = [1,1,1], outlined = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (outlined) {
    const edge = new THREE.Mesh(geometry, ink);
    edge.position.copy(mesh.position);
    edge.rotation.copy(mesh.rotation);
    edge.scale.copy(mesh.scale).multiplyScalar(1.035);
    edge.renderOrder = 1;
    parent.add(edge);
  }
  return mesh;
}
export function box(parent, material, size, position, rotation = [0,0,0], outlined = true) {
  return part(parent, new THREE.BoxGeometry(...size), material, position, rotation, [1,1,1], outlined);
}
export function sphere(parent, material, radius, position, scale = [1,1,1], outlined = true) {
  return part(parent, new THREE.SphereGeometry(radius, 18, 14), material, position, [0,0,0], scale, outlined);
}
export function cylinder(parent, material, radiusTop, radiusBottom, height, position, rotation = [0,0,0], radial = 12) {
  return part(parent, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial), material, position, rotation);
}
export function capsule(parent, material, radius, length, position, rotation = [0,0,0]) {
  const group = new THREE.Group();
  group.position.set(...position);
  parent.add(group);
  cylinder(group, material, radius, radius, length, [0,0,0], rotation, 12);
  sphere(group, material, radius, [0,length/2,0]);
  sphere(group, material, radius, [0,-length/2,0]);
  return group;
}
export function finishModel(group, name, parent, scale = 1) {
  group.name = name;
  group.scale.setScalar(scale);
  group.traverse(o => { if (o.isMesh) { o.userData.noPhysics = true; o.frustumCulled = true; } });
  if (parent) parent.add(group);
  return group;
}
