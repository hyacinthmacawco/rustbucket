import * as THREE from "three";

export class LunarSurface {
  constructor(parent) {
    parent.name = "LunarSurface";
    parent.add(new THREE.AmbientLight(0x77809a, 0.35));

    const light = new THREE.DirectionalLight(0xe7e3d8, 2.2);
    light.position.set(-30, 50, 25);
    parent.add(light);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(520, 520),
      new THREE.MeshStandardMaterial({ color: 0x777a80, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.userData.noPhysics = true;
    parent.add(ground);

    for (let index = 0; index < 26; index++) {
      const radius = 1.2 + (index % 5) * 0.75;
      const crater = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.35, 0.22, 16, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x555960, roughness: 1, side: THREE.DoubleSide })
      );
      crater.position.set(
        Math.sin(index * 12.31) * (18 + index % 4 * 8),
        -0.36,
        Math.cos(index * 7.17) * (20 + index % 5 * 7)
      );
      parent.add(crater);
    }

    this.ground = ground;
  }
}
