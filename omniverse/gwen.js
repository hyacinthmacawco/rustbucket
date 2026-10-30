import { dimensions } from '../storage/state.js';
const d = dimensions.gwen.values;
import * as THREE from 'three';

export function createGwen() {
  const gwen = new THREE.Group();
  gwen.name = 'Gwen';

  const mat = (color, roughness = d[0]) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const skin = mat(0xe9b6a5);
  const hair = mat(0xd95720);
  const hairLight = mat(0xf17a35);
  const blue = mat(0x72b6d5);
  const darkBlue = mat(0x315c88);
  const skirtBlue = mat(0x426b9a);
  const skirtLine = mat(0x91b6d0);
  const white = mat(0xe5e9e9);
  const shoeBlue = mat(0x315c92);
  const shoeDark = mat(0x172d4b);

  function ellipsoid(parent, material, x, y, z, sx, sy, sz) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(d[1], d[2], d[3]),
      material
    );
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function box(parent, material, x, y, z, sx, sy, sz) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      material
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, material, x, y, z, radiusTop, radiusBottom, height) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, d[4]),
      material
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function limb(parent, material, a, b, radiusA, radiusB) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = new THREE.Vector3().subVectors(end, start);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusB, radiusA, direction.length(), d[5]),
      material
    );
    mesh.position.copy(start).add(end).multiplyScalar(d[6]);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(d[7], d[8], d[9]),
      direction.normalize()
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // -------------------------
  // LEGS
  // -------------------------

  // Left and right legs
  for (const side of [-d[10], d[11]]) {
    const x = side * d[12];

    // Upper legs
    limb(gwen, skin, [x, d[13], d[14]], [x, d[15], d[16]], d[17], d[18]);

    // Knees
    ellipsoid(gwen, skin, x, d[19], d[20], d[21], d[22], d[23]);

    // Lower legs
    limb(gwen, skin, [x, d[24], d[25]], [x, d[26], d[27]], d[28], d[29]);

    // White knee-high socks
    cylinder(gwen, white, x, d[30], d[31], d[32], d[33], d[34]);
    ellipsoid(gwen, white, x, d[35], d[36], d[37], d[38], d[39]);

    // Sock upper edge
    cylinder(gwen, white, x, d[40], d[41], d[42], d[43], d[44]);

    // Shoes
    ellipsoid(gwen, shoeBlue, x, d[45], d[46], d[47], d[48], d[49]);
    ellipsoid(gwen, shoeDark, x, d[50], d[51], d[52], d[53], d[54]);

    // Shoe soles
    box(gwen, white, x, d[55], d[56], d[57], d[58], d[59]);

    // Shoe upper straps
    box(gwen, darkBlue, x, d[60], d[61], d[62], d[63], d[64]);
  }

  // -------------------------
  // SKIRT
  // -------------------------

  // Waist
  cylinder(gwen, darkBlue, d[65], d[66], d[67], d[68], d[69], d[70]);

  // Main skirt
  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(d[71], d[72], d[73], d[74], d[75]),
    skirtBlue
  );
  skirt.position.set(d[76], d[77], d[78]);
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  gwen.add(skirt);

  // Skirt grid lines
  for (let x = -d[79]; x <= d[80]; x++) {
    const px = x * d[81];
    box(gwen, skirtLine, px, d[82], d[83], d[84], d[85], d[86]);
  }

  for (let y = d[87]; y < d[88]; y++) {
    box(gwen, skirtLine, d[89], d[90] + y * d[91], d[92] - y * d[93], d[94] - y * d[95], d[96], d[97]);
  }

  // -------------------------
  // TORSO
  // -------------------------

  // Shirt body
  ellipsoid(gwen, blue, d[98], d[99], d[100], d[101], d[102], d[103]);

  // Shirt lower edge
  box(gwen, blue, d[104], d[105], d[106], d[107], d[108], d[109]);

  // Neck
  cylinder(gwen, skin, d[110], d[111], d[112], d[113], d[114], d[115]);

  // Shirt collar
  ellipsoid(gwen, darkBlue, d[116], d[117], d[118], d[119], d[120], d[121]);

  // Chest emblem (abstract blue symbol)
  ellipsoid(gwen, darkBlue, d[122], d[123], d[124], d[125], d[126], d[127]);
  ellipsoid(gwen, blue, d[128], d[129], d[130], d[131], d[132], d[133]);

  // -------------------------
  // ARMS
  // -------------------------

  for (const side of [-d[134], d[135]]) {
    const x = side;

    // Shoulder
    ellipsoid(gwen, blue, x * d[136], d[137], d[138], d[139], d[140], d[141]);

    // Upper arm
    limb(
      gwen, skin,
      [x * d[142], d[143], d[144]],
      [x * d[145], d[146], d[147]],
      d[148], d[149]
    );

    // Elbow
    ellipsoid(gwen, skin, x * d[150], d[151], d[152], d[153], d[154], d[155]);

    // Forearm
    limb(
      gwen, skin,
      [x * d[156], d[157], d[158]],
      [x * d[159], d[160], d[161]],
      d[162], d[163]
    );

    // Hands
    ellipsoid(gwen, skin, x * d[164], d[165], d[166], d[167], d[168], d[169]);

    // Fingers
    for (let f = d[170]; f < d[171]; f++) {
      const fx = x * (d[172] + f * d[173]);
      limb(
        gwen, skin,
        [x * d[174], d[175], d[176]],
        [fx, d[177], d[178]],
        d[179], d[180]
      );
    }
  }

  // -------------------------
  // HEAD
  // -------------------------

  // Blank head
  ellipsoid(gwen, skin, d[181], d[182], d[183], d[184], d[185], d[186]);

  // Hair cap
  ellipsoid(gwen, hair, d[187], d[188], -d[189], d[190], d[191], d[192]);

  // Hair at back
  ellipsoid(gwen, hair, d[193], d[194], -d[195], d[196], d[197], d[198]);

  // Left and right side hair
  for (const side of [-d[199], d[200]]) {
    ellipsoid(gwen, hair, side * d[201], d[202], -d[203], d[204], d[205], d[206]);
    ellipsoid(gwen, hairLight, side * d[207], d[208], d[209], d[210], d[211], d[212]);
  }

  // Front fringe
  ellipsoid(gwen, hair, -d[213], d[214], d[215], d[216], d[217], d[218]);
  ellipsoid(gwen, hairLight, d[219], d[220], d[221], d[222], d[223], d[224]);

  // Long hair tips
  for (const side of [-d[225], d[226]]) {
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(d[227], d[228], d[229]),
      hair
    );
    tip.position.set(side * d[230], d[231], -d[232]);
    tip.rotation.z = side * -d[233];
    tip.castShadow = true;
    gwen.add(tip);
  }

  // Final positioning
  gwen.position.set(d[234], d[235], d[236]);
  gwen.scale.set(d[237], d[238], d[239]);

  return gwen;
}
