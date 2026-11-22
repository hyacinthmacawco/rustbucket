import * as THREE from "three";
import { createAlienSystems } from "./alien-systems.js";

export class AnodyneSystem {
  constructor(parent) {
    const result = createAlienSystems(parent, "anodyne");
    this.root = result.root;
    this.group = result.systems[0];
    this.starfield = this.createStarfield();
  }
  createStarfield() {
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 55 + Math.random() * 125;
      const theta = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const planar = Math.sqrt(1 - z * z);
      const brightness = 0.45 + Math.random() * 0.55;
      const cool = Math.random() > 0.72;
      positions[i * 3] = radius * planar * Math.cos(theta);
      positions[i * 3 + 1] = radius * z;
      positions[i * 3 + 2] = radius * planar * Math.sin(theta);
      colors[i * 3] = brightness * (cool ? 0.68 : 1);
      colors[i * 3 + 1] = brightness * (cool ? 0.84 : 1);
      colors[i * 3 + 2] = brightness;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const stars = new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 0.14, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false
    }));
    stars.name = "AnodyneStarfield";
    this.group.add(stars);
    return stars;
  }

}
