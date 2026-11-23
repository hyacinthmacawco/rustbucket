import * as THREE from "three";
import { AlienShip } from "./AlienShip.js";

export class IncurseanShip extends AlienShip {
  createShip() {
    const olive = this.createMaterial(0x477d19);
    const gold = this.createMaterial(0xb5a51a);
    const dark = this.createMaterial(0x203c18);
    const purple = this.createMaterial(0x7626a6);
    const pink = this.createMaterial(0xff3bd0);
    const glass = this.createMaterial(0x3c1768, { emissive: 0x210a3a });

    this.addSphere(1.45, [0, 0, 0], [1.9, 0.42, 1.05], olive);
    this.addPart(new THREE.ConeGeometry(1.15, 2.8, 8), gold, [0, 0.02, 1.35], [Math.PI / 2, 0, 0], [1, 0.45, 1]);

    for (const side of [-1, 1]) {
      this.addPart(new THREE.ConeGeometry(0.9, 4.3, 5), gold, [side * 2.2, -0.04, -0.2], [0, 0, side * 0.12], [1, 0.22, 1]);
      this.addBox([0.18, 0.12, 2.7], [side * 2.1, -0.25, -0.15], dark, [0, 0, side * 0.1]);
      this.addSphere(0.72, [side * 2.35, 0.28, -0.55], [0.8, 0.65, 1.15], olive);
      this.addSphere(0.5, [side * 2.35, 0.72, -0.55], [1, 0.68, 1], purple);
      this.addSphere(0.24, [side * 2.35, 1.05, -0.55], [1, 0.35, 1], pink);
      this.addPart(new THREE.ConeGeometry(0.15, 0.6, 6), pink, [side * 3.9, -0.02, 1.05], [Math.PI / 2, 0, side * 0.1]);
    }

    this.addSphere(0.64, [0, 0.54, 0.2], [1.05, 0.62, 1.1], purple);
    this.addSphere(0.48, [0, 0.85, 0.28], [1, 0.38, 0.9], glass);
    this.addCylinder(0.14, 0.18, 1.8, [0, -0.08, -1.55], gold, [Math.PI / 2, 0, 0], 10);

    for (let index = -3; index <= 3; index++) {
      this.addBox([0.12, 0.06, 0.48], [index * 0.24, -0.28, -0.05], pink);
    }
  }
}
