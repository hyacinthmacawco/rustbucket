import * as THREE from "three";

// Create the distant starfield only when the camera is in the space region.
export function createStarfield(parent) {
  const starCount = 6500;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const radius = 45 + Math.random() * 110;
    const theta = Math.random() * Math.PI * 2;
    const z = Math.random() * 2 - 1;
    const planar = Math.sqrt(1 - z * z);
    const brightness = 0.55 + Math.random() * 0.45;
    const blueStar = Math.random() > 0.84;

    positions[i * 3] = radius * planar * Math.cos(theta);
    positions[i * 3 + 1] = radius * z;
    positions[i * 3 + 2] = radius * planar * Math.sin(theta);
    colors[i * 3] = brightness * (blueStar ? 0.65 : 1);
    colors[i * 3 + 1] = brightness * (blueStar ? 0.82 : 1);
    colors[i * 3 + 2] = brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.12,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    })
  );
  stars.name = "Starfield";
  parent.add(stars);
  return { stars };
}
