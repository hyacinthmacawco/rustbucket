import * as THREE from "three";
import { AlienShip } from "./AlienShip.js";

export class HighbreedShip extends AlienShip {
  createShip() {
    const black = this.createMaterial(0x101116);
    const charcoal = this.createMaterial(0x34363a);
    const silver = this.createMaterial(0xc4c5bd);
    const shade = this.createMaterial(0x777b7a);
    const red = this.createMaterial(0xe31d20);

    this.addBox([1.25, 0.22, 8.2], [0, 0, 0], black);

    for (const side of [-1, 1]) {
      this.addPart(
        new THREE.ConeGeometry(1, 1, 4),
        black,
        [side * 2.25, 0.02, -0.15],
        [0, 0, Math.PI / 2],
        [2.4, 0.18, 4.3]
      );
      this.addBox([0.12, 0.08, 6.9], [side * 2.2, 0.15, -0.1], charcoal, [0, 0, side * 0.015]);
      this.addSphere(0.76, [side * 2.15, -0.04, 2.25], [1, 0.86, 1], silver);
      this.addSphere(0.42, [side * 2.15, -0.05, 2.86], [1, 0.85, 0.55], shade);
      this.addCylinder(0.82, 0.72, 0.32, [side * 2.15, -0.04, 2.22], black, [Math.PI / 2, 0, 0], 20);

      for (let index = 0; index < 4; index++) {
        const angle = index * Math.PI / 2;
        this.addPart(
          new THREE.CapsuleGeometry(0.16, 0.72, 3, 8),
          charcoal,
          [side * 2.15 + Math.cos(angle) * 0.83, -0.1, 2.25 + Math.sin(angle) * 0.83],
          [Math.PI / 2, 0, angle]
        );
      }

      this.addSphere(0.085, [side * 2.15, -0.02, 3.48], [1, 1, 0.55], red);
    }

    this.addBox([0.7, 0.18, 6.2], [0, 0.18, -0.15], charcoal);
    this.addPart(new THREE.ConeGeometry(0.48, 2.4, 5), black, [0, 0.1, -3.6], [Math.PI / 2, 0, 0]);
    this.addBox([0.62, 0.24, 2.2], [0, 0.04, 3.5], black);

    for (const side of [-1, 1]) {
      this.addBox([0.42, 0.16, 3.4], [side * 0.72, 0.04, -1.8], black, [0, 0, side * 0.12]);
    }
  }
}
