import * as THREE from "three";
import { Starfield } from "./Starfield.js";

export class SolarSystem {
  constructor(parent) {
    this.root = new THREE.Group();
    this.root.name = "SolarSystem";
    parent.add(this.root);
    this.root.add(new THREE.AmbientLight(0x52617f, 0.45));

    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.sun = new THREE.Mesh(new THREE.SphereGeometry(13000, 64, 48), sunMaterial);
    this.sun.name = "Sun";
    this.sun.position.set(-274300, 0, 0);
    this.root.add(this.sun);
    new THREE.TextureLoader().load("./files/textures/sun.jpg", texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      sunMaterial.map = texture;
      sunMaterial.needsUpdate = true;
    });

    this.sunAura = new THREE.Mesh(
      new THREE.SphereGeometry(13780, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.11, side: THREE.BackSide, depthWrite: false })
    );
    this.sunAura.position.copy(this.sun.position);
    this.root.add(this.sunAura);
    this.sunOuterGlow = new THREE.Mesh(
      new THREE.SphereGeometry(15860, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xff671f, transparent: true, opacity: 0.05, side: THREE.BackSide, depthWrite: false })
    );
    this.sunOuterGlow.position.copy(this.sun.position);
    this.root.add(this.sunOuterGlow);
    this.sunlight = new THREE.PointLight(0xffb65c, 1800000000, 800000, 1.5);
    this.sunlight.position.copy(this.sun.position);
    this.root.add(this.sunlight);
    this.stars = new Starfield(this.root);
    this.root.traverse(object => { object.userData.noPhysics = true; });
  }
}
