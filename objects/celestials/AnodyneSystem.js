import * as THREE from "three";
import { Starfield } from "./Starfield.js";

export class AnodyneSystem {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = "AnodyneSystem";
    this.root.add(new THREE.AmbientLight(0x8794a8, 0.8));
    this.star = new THREE.Mesh(
      new THREE.SphereGeometry(13000, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xffb36b })
    );
    this.star.name = "AnodyneStar";
    this.root.add(this.star);
    this.starGlow = new THREE.Mesh(
      new THREE.SphereGeometry(19500, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0xffb36b, transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false })
    );
    this.root.add(this.starGlow);
    this.starlight = new THREE.PointLight(0xffb36b, 1800000000, 520000, 1.8);
    this.root.add(this.starlight);
    this.stars = new Starfield("AnodyneStarfield");
    this.root.add(this.stars.model());
    this.root.traverse(object => { object.userData.noPhysics = true; });
  }

  model() {
    return this.root;
  }

}
