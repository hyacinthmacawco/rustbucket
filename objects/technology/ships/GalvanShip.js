import * as THREE from "three";
import { AlienShip } from "./AlienShip.js";

export class GalvanShip extends AlienShip {
  createShip() {
    const green = this.createMaterial(0x168e20);
    const light = this.createMaterial(0x43d83b);
    const dark = this.createMaterial(0x075014);
    const glass = this.createMaterial(0x063b21, { emissive: 0x06240e });
    const lime = this.createMaterial(0x60ff2d);

    this.addSphere(1.55, [0, 0, 0], [1.6, 0.38, 1.12], green);
    this.addSphere(1.12, [0, -0.12, 0], [1.55, 0.25, 1.08], dark);
    this.addSphere(0.82, [0, 0.28, 0.12], [1.12, 0.28, 0.82], light);
    this.addSphere(0.58, [0, 0.55, 0.2], [0.92, 0.32, 0.74], glass);

    for (const side of [-1, 1]) {
      const pod = new THREE.Group();
      pod.position.set(side * 2.05, 0.42, -0.05);
      this.group.add(pod);

      this.addPart(new THREE.SphereGeometry(0.68, 20, 16), green, [side * 2.05, 0.42, -0.05], [0, 0, 0], [0.78, 0.52, 1.18]);
      this.addPart(new THREE.SphereGeometry(0.34, 20, 16), lime, [side * 2.05, 0.64, 0], [0, 0, 0], [1, 0.55, 1.05]);
      this.addPart(new THREE.BoxGeometry(0.2, 0.1, 0.85), dark, [side * 2.05, 0.02, -0.05]);
      for (let index = 0; index < 3; index++) {
        this.addPart(new THREE.BoxGeometry(0.09, 0.06, 0.35), light, [side * 2.05, -0.01, -0.3 + index * 0.24]);
      }
    }

    this.addSphere(0.42, [0, -0.08, 1.45], [1.3, 0.32, 0.5], light);
    this.addSphere(0.2, [0, -0.35, 1.52], [1, 0.6, 0.8], dark);

    for (let index = -2; index <= 2; index++) {
      this.addSphere(0.055, [index * 0.28, -0.02, 1.83], [1, 0.7, 0.6], lime);
    }
  }
}
