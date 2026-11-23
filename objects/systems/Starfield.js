import * as THREE from "three";

export class Starfield {
  this.random() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  constructor(parent, name = "StarfieldTexture") {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  context.fillStyle = "#02040a";
  context.fillRect(0, 0, canvas.width, canvas.height);

  this.seed = 73129;
  for (let i = 0; i < 4200; i++) {
    const x = this.this.random() * canvas.width;
    const y = this.random() * canvas.height;
    const radius = this.random() > 0.985 ? 2.2 : this.random() > 0.72 ? 1.25 : 0.65;
    const blue = this.random() > 0.86;
    const alpha = 0.35 + this.random() * 0.65;
    context.fillStyle = blue
      ? `rgba(170,205,255,${alpha})`
      : `rgba(255,255,255,${alpha})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1000000, 48, 32),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    })
  );
  dome.name = name;
  dome.userData.noPhysics = true;
  parent.add(dome);
  return dome;
  }
}
