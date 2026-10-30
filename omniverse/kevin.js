import { dimensions } from '../storage/state.js';
const d = dimensions.kevin.values;
import * as THREE from 'three';

export function createKevin() {
  const kevin = new THREE.Group();
  kevin.name = 'Kevin';

  const mat = (color) =>
    new THREE.MeshStandardMaterial({ color, roughness: d[0] });

  const skin = mat(0xd5a18e);
  const hair = mat(0x111019);
  const hairHighlight = mat(0x252b43);
  const shirt = mat(0x111114);
  const jeans = mat(0x293c59);
  const jeansLight = mat(0x465a78);
  const suspenders = mat(0x416c82);
  const metal = mat(0x687b91);
  const stripe = mat(0xb5b6ad);
  const stripeDark = mat(0x77786f);
  const shoe = mat(0x515b6b);
  const sole = mat(0x303b4b);

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

  function limb(parent, material, a, b, radiusA, radiusB) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = new THREE.Vector3().subVectors(end, start);

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusB, radiusA, direction.length(), d[4]),
      material
    );

    mesh.position.copy(start).add(end).multiplyScalar(d[5]);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(d[6], d[7], d[8]),
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

  for (const side of [-d[9], d[10]]) {
    const x = side * d[11];

    // Jeans upper legs
    limb(
      kevin, jeans,
      [x, d[12], d[13]],
      [x + side * d[14], d[15], d[16]],
      d[17], d[18]
    );

    ellipsoid(
      kevin, jeans,
      x + side * d[19], d[20], d[21],
      d[22], d[23], d[24]
    );

    // Lower jeans
    limb(
      kevin, jeans,
      [x + side * d[25], d[26], d[27]],
      [x + side * d[28], d[29], d[30]],
      d[31], d[32]
    );

    // Slightly loose trouser cuffs
    ellipsoid(
      kevin, jeans,
      x + side * d[33], d[34], d[35],
      d[36], d[37], d[38]
    );

    // Shoe bodies
    ellipsoid(
      kevin, shoe,
      x + side * d[39], d[40], d[41],
      d[42], d[43], d[44]
    );

    // Shoe front
    ellipsoid(
      kevin, shoe,
      x + side * d[45], d[46], d[47],
      d[48], d[49], d[50]
    );

    // Soles
    box(
      kevin, sole,
      x + side * d[51], d[52], d[53],
      d[54], d[55], d[56]
    );

    // Shoe upper panels
    box(
      kevin, metal,
      x + side * d[57], d[58], d[59],
      d[60], d[61], d[62]
    );

    // Shoe vents
    for (let i = -d[63]; i <= d[64]; i++) {
      box(
        kevin, sole,
        x + side * d[65] + i * d[66],
        d[67],
        d[68],
        d[69], d[70], d[71]
      );
    }
  }

  // -------------------------
  // TORSO
  // -------------------------

  // Shirt
  ellipsoid(kevin, shirt, d[72], d[73], d[74], d[75], d[76], d[77]);

  // Lower shirt
  box(kevin, shirt, d[78], d[79], d[80], d[81], d[82], d[83]);

  // Neck
  cylinder:
  {
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(d[84], d[85], d[86], d[87]),
      skin
    );
    neck.position.set(d[88], d[89], d[90]);
    neck.castShadow = true;
    kevin.add(neck);
  }

  // Striped scarf / collar
  ellipsoid(kevin, stripeDark, d[91], d[92], d[93], d[94], d[95], d[96]);
  ellipsoid(kevin, stripe, d[97], d[98], d[99], d[100], d[101], d[102]);

  // -------------------------
  // SUSPENDERS
  // -------------------------

  for (const side of [-d[103], d[104]]) {
    // Front suspenders
    box(
      kevin, suspenders,
      side * d[105], d[106], d[107],
      d[108], d[109], d[110]
    );

    // Back suspenders
    box(
      kevin, suspenders,
      side * d[111], d[112], -d[113],
      d[114], d[115], d[116]
    );

    // Lower attachment pockets
    box(
      kevin, suspenders,
      side * d[117], d[118], d[119],
      d[120], d[121], d[122]
    );

    // Pocket flap
    box(
      kevin, metal,
      side * d[123], d[124], d[125],
      d[126], d[127], d[128]
    );

    // Buttons
    ellipsoid(
      kevin, metal,
      side * d[129], d[130], d[131],
      d[132], d[133], d[134]
    );
  }

  // -------------------------
  // ARMS
  // -------------------------

  for (const side of [-d[135], d[136]]) {
    const shoulderX = side * d[137];
    const elbowX = side * d[138];
    const handX = side * d[139];

    // Upper shirt sleeves
    limb(
      kevin, shirt,
      [shoulderX, d[140], d[141]],
      [elbowX, d[142], d[143]],
      d[144], d[145]
    );

    // Upper striped sleeve band
    ellipsoid(
      kevin, stripe,
      side * d[146], d[147], d[148],
      d[149], d[150], d[151]
    );

    // Elbow
    ellipsoid(
      kevin, skin,
      elbowX, d[152], d[153],
      d[154], d[155], d[156]
    );

    // Forearm
    limb(
      kevin, skin,
      [elbowX, d[157], d[158]],
      [handX, d[159], d[160]],
      d[161], d[162]
    );

    // Striped sleeve wraps
    for (let i = d[163]; i < d[164]; i++) {
      const y = d[165] - i * d[166];
      const material = i % d[167] === d[168] ? stripe : stripeDark;

      ellipsoid(
        kevin, material,
        side * (d[169] + i * d[170]),
        y, d[171],
        d[172], d[173], d[174]
      );
    }

    // Hands
    ellipsoid(
      kevin, skin,
      handX, d[175], d[176],
      d[177], d[178], d[179]
    );

    // Fingers
    for (let f = d[180]; f < d[181]; f++) {
      const offset = (f - d[182]) * d[183];

      limb(
        kevin, skin,
        [handX + offset, d[184], d[185]],
        [handX + offset * d[186], d[187], d[188]],
        d[189], d[190]
      );
    }

    // Thumb
    limb(
      kevin, skin,
      [handX - side * d[191], d[192], d[193]],
      [handX - side * d[194], d[195], d[196]],
      d[197], d[198]
    );
  }

  // -------------------------
  // PANTS DETAILS
  // -------------------------

  // Waistband
  box(kevin, jeansLight, d[199], d[200], d[201], d[202], d[203], d[204]);

  // Fly seam
  box(kevin, jeansLight, d[205], d[206], d[207], d[208], d[209], d[210]);

  // Belt loop
  box(kevin, jeansLight, d[211], d[212], d[213], d[214], d[215], d[216]);

  // Torn patch on one knee
  box(kevin, metal, d[217], d[218], d[219], d[220], d[221], d[222]);
  box(kevin, jeansLight, d[223], d[224], d[225], d[226], d[227], d[228]);

  // -------------------------
  // NECKLACE
  // -------------------------

  // Necklace cord
  const cord = new THREE.Mesh(
    new THREE.TorusGeometry(d[229], d[230], d[231], d[232], Math.PI),
    metal
  );
  cord.position.set(d[233], d[234], d[235]);
  cord.rotation.x = Math.PI;
  cord.castShadow = true;
  kevin.add(cord);

  // Pendant
  box(kevin, metal, d[236], d[237], d[238], d[239], d[240], d[241]);
  box(kevin, jeans, d[242], d[243], d[244], d[245], d[246], d[247]);

  // -------------------------
  // HEAD AND HAIR
  // -------------------------

  // Blank head
  ellipsoid(kevin, skin, d[248], d[249], d[250], d[251], d[252], d[253]);

  // Hair cap
  ellipsoid(kevin, hair, d[254], d[255], -d[256], d[257], d[258], d[259]);

  // Hair back
  ellipsoid(kevin, hair, d[260], d[261], -d[262], d[263], d[264], d[265]);

  // Hair fringe
  ellipsoid(kevin, hairHighlight, -d[266], d[267], d[268], d[269], d[270], d[271]);

  // Long side locks
  for (const side of [-d[272], d[273]]) {
    const lock = new THREE.Mesh(
      new THREE.ConeGeometry(d[274], d[275], d[276]),
      hair
    );

    lock.position.set(side * d[277], d[278], d[279]);
    lock.rotation.z = side * -d[280];
    lock.castShadow = true;
    kevin.add(lock);
  }

  // Rear hair length
  for (const side of [-d[281], d[282]]) {
    ellipsoid(
      kevin, hair,
      side * d[283], d[284], -d[285],
      d[286], d[287], d[288]
    );
  }

  // Final scale
  kevin.scale.set(d[289], d[290], d[291]);

  return kevin;
}
