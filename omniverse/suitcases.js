import * as THREE from "three";

export function createSuitcases(parent) {
  const owners = ["ben", "gwen", "kevin", "rook"];
  const colors = [0x263d35, 0x9a4f36, 0x394b69, 0x77715b];
  const suitcases = owners.map((owner, index) => {
    const group = new THREE.Group();
    group.name = `${owner[0].toUpperCase()}${owner.slice(1)}Suitcase`;
    group.position.set(-5.4 + index * 3.6, 0.38, 5.5);
    group.userData.pickable = true;
    group.userData.owner = owner;
    group.userData.carriedBy = null;
    group.userData.stored = false;
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.62, 0.42),
      new THREE.MeshStandardMaterial({ color: colors[index], roughness: 0.72 })
    );
    shell.castShadow = true;
    shell.receiveShadow = true;
    group.add(shell);
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(0.91, 0.09, 0.43),
      new THREE.MeshStandardMaterial({ color: colors[index] ^ 0x202020, roughness: 0.65 })
    );
    lid.position.y = 0.34;
    group.add(lid);
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.035, 6, 12, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xc6c2ae, metalness: 0.55, roughness: 0.4 })
    );
    handle.rotation.z = Math.PI;
    handle.position.set(0, 0.42, 0);
    group.add(handle);
    parent.add(group);
    return group;
  });
  return { suitcases };
}
