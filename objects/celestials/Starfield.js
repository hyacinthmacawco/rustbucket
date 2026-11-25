import * as THREE from "three";

export class Starfield {
  static createAtmosphere(skyColor, { afternoon = false } = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext("2d");
    const sky = new THREE.Color(skyColor);
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    if (afternoon) {
      gradient.addColorStop(0, "#5b91c2");
      gradient.addColorStop(0.34, "#83b5dc");
      gradient.addColorStop(0.72, "#b8d5e8");
      gradient.addColorStop(1, "#f0d2ad");
    } else {
      gradient.addColorStop(0, "#02040a");
      gradient.addColorStop(0.28, "#101522");
      gradient.addColorStop(0.62, sky.clone().lerp(new THREE.Color(0x02040a), 0.42).getStyle());
      gradient.addColorStop(1, sky.getStyle());
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    let seed = 73129;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let index = 0; !afternoon && index < 5200; index++) {
      const x = random() * canvas.width;
      const y = random() * canvas.height * 0.72;
      const radius = random() > 0.985 ? 2.1 : random() > 0.72 ? 1.15 : 0.55;
      const alpha = 0.35 + random() * 0.65;
      context.fillStyle = random() > 0.86
        ? `rgba(170,205,255,${alpha})`
        : `rgba(255,255,255,${alpha})`;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1500, 48, 32),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, fog: false })
    );
    dome.name = "PlanetAtmosphereSky";
    dome.position.y = -5;
    dome.userData.noPhysics = true;
    return dome;
  }

  constructor(name = "StarfieldTexture") {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext("2d");
    context.fillStyle = "#02040a";
    context.fillRect(0, 0, canvas.width, canvas.height);

    let seed = 73129;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let index = 0; index < 4200; index++) {
      const x = random() * canvas.width;
      const y = random() * canvas.height;
      const radius = random() > 0.985 ? 2.2 : random() > 0.72 ? 1.25 : 0.65;
      const blue = random() > 0.86;
      const alpha = 0.35 + random() * 0.65;
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
    this.dome = new THREE.Mesh(
      new THREE.SphereGeometry(1000000, 48, 32),
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false
      })
    );
    this.dome.name = name;
    this.dome.userData.noPhysics = true;

  }

  model() {
    return this.dome;
  }

}
