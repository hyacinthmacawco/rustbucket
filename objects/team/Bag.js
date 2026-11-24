import * as THREE from "three";

export class Bag {
  constructor(parent, position, owner, color) {
    this.owner = owner;
    this.resources = {};
    this.pickable = true;
    this.stored = false;
    this.group = new THREE.Group();
    this.group.name = owner + "Bag";
    this.group.position.set(...position);
    this.group.userData.pickable = true;
    this.group.userData.owner = owner;
    this.group.userData.bag = this;

    this.materials = {
      fabric: new THREE.MeshStandardMaterial({ color, roughness: 0.92 }),
      trim: new THREE.MeshStandardMaterial({ color: 0x252b2b, roughness: 0.86 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x9da5a0, metalness: 0.72, roughness: 0.35 })
    };

    this.createModel();
    parent.add(this.group);
  }

  createModel() {
    const { fabric, trim, metal } = this.materials;
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, 0.72, 5, 12),
      fabric
    );
    body.rotation.z = Math.PI / 2;
    body.scale.set(1, 0.78, 0.72);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    const sidePanel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.045, 20),
      trim
    );
    sidePanel.rotation.z = Math.PI / 2;
    sidePanel.position.x = 0.43;
    this.group.add(sidePanel);

    const otherPanel = sidePanel.clone();
    otherPanel.position.x = -0.43;
    this.group.add(otherPanel);

    const zipper = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.025, 0.025),
      metal
    );
    zipper.position.set(0, 0.31, 0.28);
    this.group.add(zipper);

    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.045, 8, 20, Math.PI),
      trim
    );
    handle.position.y = 0.43;
    handle.rotation.z = Math.PI;
    this.group.add(handle);

    const strap = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.78, 0.08),
      trim
    );
    strap.position.set(0, 0, -0.34);
    this.group.add(strap);

    this.group.traverse(object => {
      if (object.isMesh) object.userData.noPhysics = true;
    });
  }

  setStored(stored) {
    this.stored = Boolean(stored);
    this.pickable = !this.stored;
    this.group.visible = !this.stored;
    this.group.userData.pickable = this.pickable;
    return this.stored;
  }
}
