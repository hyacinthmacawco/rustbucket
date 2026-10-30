import { dimensions } from '../storage/state.js';
const d = dimensions.rustbucket.values;
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createRustbucket(scene) {
  function material(color, roughness = d[0], extra = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: d[1],
      ...extra
    });
  }

  function addMesh(geometry, mat, parent, position, rotation = [d[2], d[3], d[4]]) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCylinderBetween(parent, start, end, radius, mat) {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(b, a);

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius, radius, direction.length(), d[5]
      ),
      mat
    );

    mesh.position.copy(a).add(b).multiplyScalar(d[6]);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(d[7], d[8], d[9]),
      direction.normalize()
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const cream = material(0xd5cda7, d[10]);
  const paleCream = material(0xe2dbb9, d[11]);
  const orange = material(0xc76b36);
  const orangeDark = material(0x713d2d);
  const stripeMaterial = material(0xb85c37);
  const blueGray = material(0x657789, d[12]);
  const metal = material(0x323b46, d[13]);

  const glass = material(0x46616c, d[14], {
    metalness: d[15]
  });

  const ship = new THREE.Group();
  ship.name = "Rustbucket";
  ship.position.set(d[16], d[17], d[18]);
  scene.add(ship);

  // Main fuselage. Nose points along +Z.
  addMesh(
    new THREE.CylinderGeometry(d[19], d[20], d[21], d[22]),
    cream,
    ship,
    [d[23], d[24], d[25]],
    [Math.PI / d[26], d[27], d[28]]
  );

  // Nose cone and orange nose band.
  addMesh(
    new THREE.ConeGeometry(d[29], d[30], d[31]),
    paleCream,
    ship,
    [d[32], d[33], d[34]],
    [Math.PI / d[35], d[36], d[37]]
  );

  addMesh(
    new THREE.CylinderGeometry(d[38], d[39], d[40], d[41]),
    orange,
    ship,
    [d[42], d[43], d[44]],
    [Math.PI / d[45], d[46], d[47]]
  );

  // Rear collar and main engine housing.
  addMesh(
    new THREE.CylinderGeometry(d[48], d[49], d[50], d[51]),
    blueGray,
    ship,
    [d[52], d[53], -d[54]],
    [Math.PI / d[55], d[56], d[57]]
  );

  addMesh(
    new THREE.CylinderGeometry(d[58], d[59], d[60], d[61]),
    blueGray,
    ship,
    [d[62], -d[63], -d[64]],
    [Math.PI / d[65], d[66], d[67]]
  );

  for (const x of [-d[68], d[69]]) {
    addMesh(
      new THREE.CylinderGeometry(d[70], d[71], d[72], d[73]),
      orangeDark,
      ship,
      [x, -d[74], -d[75]],
      [Math.PI / d[76], d[77], d[78]]
    );

    addMesh(
      new THREE.CircleGeometry(d[79], d[80]),
      metal,
      ship,
      [x, -d[81], -d[82]]
    );
  }

  // Cockpit glazing.
  for (let i = d[83]; i < d[84]; i++) {
    addMesh(
      new THREE.BoxGeometry(d[85], d[86], d[87]),
      glass,
      ship,
      [-d[88] + i * d[89], d[90], d[91] - i * d[92]],
      [-d[93], d[94], d[95]]
    );
  }

  addMesh(
    new THREE.BoxGeometry(d[96], d[97], d[98]),
    glass,
    ship,
    [d[99], d[100], d[101]],
    [-d[102], d[103], d[104]]
  );

  // Broad swept wings, orange tips, and stripes.
  function addWing(side) {
    const shape = new THREE.Shape();

    shape.moveTo(d[105], d[106]);
    shape.lineTo(d[107], d[108]);
    shape.lineTo(d[109], d[110]);
    shape.lineTo(d[111], -d[112]);
    shape.lineTo(d[113], -d[114]);
    shape.closePath();

    const wing = addMesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: d[115],
        bevelEnabled: true,
        bevelSegments: d[116],
        steps: d[117],
        bevelSize: d[118],
        bevelThickness: d[119]
      }),
      cream,
      ship,
      [d[120], -d[121], -d[122]],
      [-Math.PI / d[123], d[124], d[125]]
    );

    wing.scale.x = side;

    addMesh(
      new THREE.BoxGeometry(d[126], d[127], d[128]),
      orange,
      ship,
      [side * d[129], -d[130], d[131]],
      [d[132], side * -d[133], d[134]]
    );

    const stripeShape = new THREE.Shape();
    stripeShape.moveTo(d[135], d[136]);
    stripeShape.lineTo(d[137], d[138]);
    stripeShape.lineTo(d[139], d[140]);
    stripeShape.lineTo(d[141], d[142]);
    stripeShape.closePath();

    const stripe = addMesh(
      new THREE.ExtrudeGeometry(stripeShape, {
        depth: d[143],
        bevelEnabled: false
      }),
      stripeMaterial,
      ship,
      [d[144], -d[145], d[146]],
      [-Math.PI / d[147], d[148], d[149]]
    );

    stripe.scale.x = side;
  }

  addWing(d[150]);
  addWing(-d[151]);

  // Tail fins and orange fin markings.
  for (const side of [-d[152], d[153]]) {
    addMesh(
      new THREE.BoxGeometry(d[154], d[155], d[156]),
      paleCream,
      ship,
      [side * d[157], d[158], -d[159]],
      [d[160], side * d[161], side * -d[162]]
    );

    addMesh(
      new THREE.BoxGeometry(d[163], d[164], d[165]),
      orange,
      ship,
      [side * d[166], d[167], -d[168]],
      [d[169], d[170], side * -d[171]]
    );
  }

  addMesh(
    new THREE.BoxGeometry(d[172], d[173], d[174]),
    cream,
    ship,
    [d[175], d[176], -d[177]]
  );

  // Orange stripe on top of the fuselage.
  addMesh(
    new THREE.BoxGeometry(d[178], d[179], d[180]),
    stripeMaterial,
    ship,
    [d[181], d[182], -d[183]]
  );

  // Side panels.
  for (const side of [-d[184], d[185]]) {
    for (let i = d[186]; i < d[187]; i++) {
      addMesh(
        new THREE.BoxGeometry(d[188], d[189], d[190]),
        blueGray,
        ship,
        [side * d[191], -d[192], d[193] - i * d[194]]
      );
    }
  }

  // Wing-mounted engine pods and orange intakes.
  for (const side of [-d[195], d[196]]) {
    addMesh(
      new THREE.CylinderGeometry(d[197], d[198], d[199], d[200]),
      blueGray,
      ship,
      [side * d[201], -d[202], -d[203]],
      [Math.PI / d[204], d[205], d[206]]
    );

    addMesh(
      new THREE.CylinderGeometry(d[207], d[208], d[209], d[210]),
      orange,
      ship,
      [side * d[211], -d[212], d[213]],
      [Math.PI / d[214], d[215], d[216]]
    );
  }

  // Landing gear.
  for (const side of [-d[217], d[218]]) {
    addCylinderBetween(
      ship,
      [side * d[219], -d[220], d[221]],
      [side * d[222], -d[223], d[224]],
      d[225],
      metal
    );

    addCylinderBetween(
      ship,
      [side * d[226], -d[227], -d[228]],
      [side * d[229], -d[230], -d[231]],
      d[232],
      metal
    );
  }

  // Soft shadow beneath the spacecraft.
  const shadow = addMesh(
    new THREE.CircleGeometry(d[233], d[234]),
    new THREE.MeshBasicMaterial({
      color: 0x080a0e,
      transparent: true,
      opacity: d[235],
      depthWrite: false
    }),
    scene,
    [d[236], d[237], d[238]],
    [-Math.PI / d[239], d[240], d[241]]
  );

  shadow.name = "RustbucketGroundShadow";
  shadow.scale.set(d[242], d[243], d[244]);
  shadow.castShadow = false;
  shadow.receiveShadow = false;

  return { ship, shadow };
}
