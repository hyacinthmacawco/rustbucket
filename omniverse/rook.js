import { dimensions } from '../storage/state.js';
const d = dimensions.rook.values;
import * as THREE from 'three';

export function createRook() {
  const rook = new THREE.Group();
  rook.name = 'Rook';

  const mat = (color, metalness = d[0]) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: d[1],
      metalness
    });

  const skin = mat(0xc8d5dc);
  const skinShade = mat(0x8296ad);
  const black = mat(0x101116);
  const blackLight = mat(0x24232f);
  const blue = mat(0x304e80);
  const blueLight = mat(0x496a9e);
  const armor = mat(0x8799ae, d[2]);
  const armorDark = mat(0x53677f, d[3]);
  const toolBlack = mat(0x17191f, d[4]);
  const toolMetal = mat(0x999987, d[5]);

  function ellipsoid(parent, material, x, y, z, sx, sy, sz) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(d[6], d[7], d[8]),
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
      new THREE.CylinderGeometry(
        radiusB,
        radiusA,
        direction.length(),
        d[9]
      ),
      material
    );

    mesh.position.copy(start).add(end).multiplyScalar(d[10]);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(d[11], d[12], d[13]),
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

  for (const side of [-d[14], d[15]]) {
    const hipX = side * d[16];

    // Upper legs
    limb(
      rook, black,
      [hipX, d[17], d[18]],
      [side * d[19], d[20], d[21]],
      d[22], d[23]
    );

    // Knees
    ellipsoid(
      rook, black,
      side * d[24], d[25], d[26],
      d[27], d[28], d[29]
    );

    // Lower legs
    limb(
      rook, black,
      [side * d[30], d[31], d[32]],
      [side * d[33], d[34], d[35]],
      d[36], d[37]
    );

    // Blue shin armor
    ellipsoid(
      rook, blue,
      side * d[38], d[39], d[40],
      d[41], d[42], d[43]
    );

    // Metallic outer shin plate
    ellipsoid(
      rook, armor,
      side * d[44], d[45], d[46],
      d[47], d[48], d[49]
    );

    // Back of shin armor
    ellipsoid(
      rook, armorDark,
      side * d[50], d[51], -d[52],
      d[53], d[54], d[55]
    );

    // Ankle
    ellipsoid(
      rook, black,
      side * d[56], d[57], d[58],
      d[59], d[60], d[61]
    );

    // Feet
    ellipsoid(
      rook, blue,
      side * d[62], d[63], d[64],
      d[65], d[66], d[67]
    );

    // Black toe caps
    ellipsoid(
      rook, black,
      side * d[68], d[69], d[70],
      d[71], d[72], d[73]
    );

    // Shoe soles
    box(
      rook, armor,
      side * d[74], d[75], d[76],
      d[77], d[78], d[79]
    );

    // Outer knee/leg armor
    ellipsoid(
      rook, armor,
      side * d[80], d[81], -d[82],
      d[83], d[84], d[85]
    );
  }

  // -------------------------
  // PELVIS AND WAIST
  // -------------------------

  ellipsoid(rook, black, d[86], d[87], d[88], d[89], d[90], d[91]);

  // Blue waist armor
  box(rook, blue, d[92], d[93], d[94], d[95], d[96], d[97]);

  // Central lower abdomen armor
  ellipsoid(
    rook, black,
    d[98], d[99], d[100],
    d[101], d[102], d[103]
  );

  // Side hip armor
  for (const side of [-d[104], d[105]]) {
    ellipsoid(
      rook, armor,
      side * d[106], d[107], d[108],
      d[109], d[110], d[111]
    );
  }

  // -------------------------
  // TORSO
  // -------------------------

  // Main black bodysuit
  ellipsoid(
    rook, black,
    d[112], d[113], d[114],
    d[115], d[116], d[117]
  );

  // Upper chest
  ellipsoid(
    rook, black,
    d[118], d[119], d[120],
    d[121], d[122], d[123]
  );

  // Blue chest armor
  ellipsoid(
    rook, blue,
    d[124], d[125], d[126],
    d[127], d[128], d[129]
  );

  // Upper chest armor plate
  box(
    rook, blue,
    d[130], d[131], d[132],
    d[133], d[134], d[135]
  );

  // Central chest plate
  ellipsoid(
    rook, blueLight,
    d[136], d[137], d[138],
    d[139], d[140], d[141]
  );

  // Chest plate lower border
  box(
    rook, black,
    d[142], d[143], d[144],
    d[145], d[146], d[147]
  );

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(d[148], d[149], d[150], d[151]),
    skin
  );
  neck.position.set(d[152], d[153], d[154]);
  neck.castShadow = true;
  rook.add(neck);

  // Black neck suit
  ellipsoid(
    rook, black,
    d[155], d[156], d[157],
    d[158], d[159], d[160]
  );

  // -------------------------
  // SHOULDERS
  // -------------------------

  for (const side of [-d[161], d[162]]) {
    // Black shoulder base
    ellipsoid(
      rook, black,
      side * d[163], d[164], d[165],
      d[166], d[167], d[168]
    );

    // Blue shoulder plates
    ellipsoid(
      rook, blue,
      side * d[169], d[170], d[171],
      d[172], d[173], d[174]
    );

    // Shoulder armor highlight
    ellipsoid(
      rook, blueLight,
      side * d[175], d[176], d[177],
      d[178], d[179], d[180]
    );
  }

  // -------------------------
  // ARMS
  // -------------------------

  for (const side of [-d[181], d[182]]) {
    const shoulderX = side * d[183];
    const elbowX = side * d[184];
    const wristX = side * d[185];

    // Upper arm
    limb(
      rook, black,
      [shoulderX, d[186], d[187]],
      [elbowX, d[188], d[189]],
      d[190], d[191]
    );

    // Elbow
    ellipsoid(
      rook, black,
      elbowX, d[192], d[193],
      d[194], d[195], d[196]
    );

    // Forearm
    limb(
      rook, black,
      [elbowX, d[197], d[198]],
      [wristX, d[199], d[200]],
      d[201], d[202]
    );

    // Blue forearm armor
    ellipsoid(
      rook, blue,
      side * d[203], d[204], d[205],
      d[206], d[207], d[208]
    );

    // Metallic forearm plate
    ellipsoid(
      rook, armor,
      side * d[209], d[210], d[211],
      d[212], d[213], d[214]
    );

    // Wrist
    ellipsoid(
      rook, skinShade,
      wristX, d[215], d[216],
      d[217], d[218], d[219]
    );

    // Hand palm
    ellipsoid(
      rook, skinShade,
      wristX, d[220], d[221],
      d[222], d[223], d[224]
    );

    // Three long fingers
    for (let f = d[225]; f < d[226]; f++) {
      const offset = (f - d[227]) * d[228];

      limb(
        rook, skinShade,
        [wristX + offset, d[229], d[230]],
        [wristX + offset * d[231], d[232], d[233]],
        d[234], d[235]
      );
    }

    // Opposing thumb
    limb(
      rook, skinShade,
      [wristX - side * d[236], d[237], d[238]],
      [wristX - side * d[239], d[240], d[241]],
      d[242], d[243]
    );
  }

  // -------------------------
  // HEAD
  // -------------------------

  // Main blank alien head
  ellipsoid(
    rook, skin,
    d[244], d[245], d[246],
    d[247], d[248], d[249]
  );

  // Lower jaw shape
  ellipsoid(
    rook, skin,
    d[250], d[251], d[252],
    d[253], d[254], d[255]
  );

  // Dark side head markings
  for (const side of [-d[256], d[257]]) {
    ellipsoid(
      rook, black,
      side * d[258], d[259], d[260],
      d[261], d[262], d[263]
    );
  }

  // Rear head structure
  ellipsoid(
    rook, skinShade,
    d[264], d[265], -d[266],
    d[267], d[268], d[269]
  );

  // Top head markings
  ellipsoid(
    rook, black,
    d[270], d[271], -d[272],
    d[273], d[274], d[275]
  );

  // Side head fins
  for (const side of [-d[276], d[277]]) {
    const fin = new THREE.Mesh(
      new THREE.ConeGeometry(d[278], d[279], d[280]),
      skinShade
    );

    fin.position.set(side * d[281], d[282], -d[283]);
    fin.rotation.z = -side * Math.PI / d[284];
    fin.castShadow = true;
    rook.add(fin);
  }

  // -------------------------
  // PROTO-TOOL ON BACK
  // -------------------------

  // Main tool housing
  const tool = new THREE.Group();
  tool.name = 'ProtoTool';
  tool.position.set(d[285], d[286], -d[287]);
  tool.rotation.z = -d[288];
  tool.rotation.x = -d[289];
  rook.add(tool);

  // Long main casing
  box(
    tool, toolBlack,
    d[290], d[291], d[292],
    d[293], d[294], d[295]
  );

  // Upper casing
  ellipsoid(
    tool, toolBlack,
    d[296], d[297], d[298],
    d[299], d[300], d[301]
  );

  // Main metallic side panel
  box(
    tool, toolMetal,
    d[302], d[303], d[304],
    d[305], d[306], d[307]
  );

  // Lower metallic panel
  box(
    tool, armorDark,
    d[308], -d[309], d[310],
    d[311], d[312], d[313]
  );

  // Tool upper tip
  const toolTip = new THREE.Mesh(
    new THREE.ConeGeometry(d[314], d[315], d[316]),
    toolBlack
  );
  toolTip.position.set(d[317], d[318], d[319]);
  toolTip.castShadow = true;
  tool.add(toolTip);

  // Side mechanical ridges
  for (let i = d[320]; i < d[321]; i++) {
    const ridge = box(
      tool,
      blackLight,
      d[322],
      d[323] - i * d[324],
      d[325],
      d[326],
      d[327],
      d[328]
    );
    ridge.rotation.z = -d[329];
  }

  // Tool bottom connector
  ellipsoid(
    tool, armorDark,
    d[330], -d[331], d[332],
    d[333], d[334], d[335]
  );

  // Shoulder mounting bracket
  box(
    rook, blackLight,
    d[336], d[337], -d[338],
    d[339], d[340], d[341]
  );

  // Final scale
  rook.scale.set(d[342], d[343], d[344]);

  return rook;
}
