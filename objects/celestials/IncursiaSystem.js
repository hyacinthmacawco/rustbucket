import * as THREE from "three";
import { Starfield } from "./Starfield.js";
import { Incursia } from "./Incursia.js";

export class IncursiaSystem {
  constructor() {
    this.songs = ["./files/songs/baird-ten.m4a","./files/songs/daydreams-af-lofi.m4a"];
    this.root = new THREE.Group();
    this.root.name = "IncursiaSystem";
    this.root.add(new THREE.AmbientLight(0x8794a8, 0.8));
    this.star = new THREE.Mesh(
      new THREE.SphereGeometry(13000, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xffc17b })
    );
    this.star.name = "IncursiaStar";
    this.root.add(this.star);
    this.starGlow = new THREE.Mesh(
      new THREE.SphereGeometry(19500, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0xffc17b, transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false })
    );
    this.root.add(this.starGlow);
    this.starlight = new THREE.PointLight(0xffc17b, 1800000000, 520000, 1.8);
    this.root.add(this.starlight);
    this.stars = new Starfield("IncursiaStarfield");
    this.root.add(this.stars.model());
    this.planet = new Incursia();
    this.ships = this.planet.spawnShips(this.root);
    this.root.traverse(object => { object.userData.noPhysics = true; });
  }

  animate(delta, elapsed) {
    this.planet.animateShips(delta);
  }

  model() {
    return this.root;
  }

}
