import { dimensions } from '../storage/state.js';
const d = dimensions.ben.values;
export default function createBen(THREE) {
  const root = new THREE.Group();
  root.name = 'Ben';

  const body = new THREE.Group();
  body.name = 'BenBody';
  root.add(body);

  const material = (color, roughness = d[0]) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const skin = material(0xd9a28d);
  const skinShadow = material(0xb87869);
  const hair = material(0x382019);
  const hairLight = material(0x65402a);
  const shirt = material(0x101714);
  const green = material(0x079747);
  const greenDark = material(0x075b32);
  const pants = material(0x75452e);
  const pantsLight = material(0x89563a);
  const pantsDark = material(0x43291e);
  const shoe = material(0x202523);
  const white = material(0xe4e8e5);
  const sole = material(0x9ba3a2);
  const watchBlack = material(0x202823);

  function mesh(geometry, mat, parent, position, scale) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position);

    if (scale) object.scale.set(...scale);

    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function box(parent, mat, position, size) {
    return mesh(
      new THREE.BoxGeometry(...size),
      mat,
      parent,
      position
    );
  }

  function sphere(parent, mat, position, scale) {
    return mesh(
      new THREE.SphereGeometry(d[1], d[2], d[3]),
      mat,
      parent,
      position,
      scale
    );
  }

  function capsule(parent, mat, a, b, radius, segments = d[4]) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);

    const object = mesh(
      new THREE.CapsuleGeometry(radius, direction.length(), d[5], segments),
      mat,
      parent,
      start.clone().add(end).multiplyScalar(d[6]).toArray()
    );

    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(d[7], d[8], d[9]),
      direction.normalize()
    );

    return object;
  }

  // --------------------------------------------------
  // HEAD: intentionally blank, with no facial features.
  // --------------------------------------------------

  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(d[10], d[11], d[12]);
  body.add(head);

  sphere(head, skin, [d[13], d[14], d[15]], [d[16], d[17], d[18]]);

  // Neck.
  capsule(
    body, skin,
    [d[19], d[20], d[21]],
    [d[22], d[23], d[24]],
    d[25]
  );

  // Hair cap and rear hair mass.
  sphere(head, hair, [d[26], d[27], -d[28]], [d[29], d[30], d[31]]);

  // Side and back hair.
  sphere(head, hair, [-d[32], d[33], -d[34]], [d[35], d[36], d[37]]);
  sphere(head, hair, [d[38], d[39], -d[40]], [d[41], d[42], d[43]]);
  sphere(head, hair, [d[44], -d[45], -d[46]], [d[47], d[48], d[49]]);

  // Angular hair spikes, all made from simple cones.
  function spike(parent, position, rotation, size) {
    const part = mesh(
      new THREE.ConeGeometry(size, size * d[50], d[51]),
      hair,
      parent,
      position,
      [d[52], d[53], d[54]]
    );
    part.rotation.set(...rotation);
    return part;
  }

  spike(head, [-d[55], d[56], -d[57]], [d[58], d[59], d[60]], d[61]);
  spike(head, [d[62], d[63], -d[64]], [d[65], d[66], d[67]], d[68]);
  spike(head, [d[69], d[70], -d[71]], [d[72], d[73], -d[74]], d[75]);

  // --------------------------------------------------
  // TORSO: black shirt with green center stripe.
  // --------------------------------------------------

  const torso = new THREE.Group();
  torso.name = 'Torso';
  torso.position.y = d[76];
  body.add(torso);

  sphere(torso, shirt, [d[77], d[78], d[79]], [d[80], d[81], d[82]]);

  // Main shirt body.
  box(torso, shirt, [d[83], -d[84], d[85]], [d[86], d[87], d[88]]);

  // Green vertical shirt stripe.
  box(torso, green, [d[89], -d[90], d[91]], [d[92], d[93], d[94]]);

  // Green shoulder panels.
  sphere(torso, green, [-d[95], d[96], d[97]], [d[98], d[99], d[100]]);
  sphere(torso, green, [d[101], d[102], d[103]], [d[104], d[105], d[106]]);

  // Collar.
  const collar = mesh(
    new THREE.TorusGeometry(d[107], d[108], d[109], d[110]),
    green,
    torso,
    [d[111], d[112], d[113]],
    [d[114], d[115], d[116]]
  );
  collar.rotation.x = Math.PI / d[117];

  // Number 10, drawn on a canvas to avoid a font dependency.
  const canvas = document.createElement('canvas');
  canvas.width = d[118];
  canvas.height = d[119];

  const ctx = canvas.getContext('2d');
  ctx.clearRect(d[120], d[121], d[122], d[123]);
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = d[124];
  ctx.strokeStyle = '#e9eee9';
  ctx.strokeText('10', d[125], d[126]);
  ctx.fillStyle = '#a8d5b2';
  ctx.fillText('10', d[127], d[128]);

  const numberTexture = new THREE.CanvasTexture(canvas);
  const numberMat = new THREE.MeshBasicMaterial({
    map: numberTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const number = mesh(
    new THREE.PlaneGeometry(d[129], d[130]),
    numberMat,
    torso,
    [d[131], -d[132], d[133]]
  );
  number.name = 'ShirtNumber10';

  // --------------------------------------------------
  // ARMS: pivoted at the shoulders.
  // --------------------------------------------------

  const arms = [];

  for (const side of [-d[134], d[135]]) {
    const shoulder = new THREE.Group();
    shoulder.name = side < d[136] ? 'LeftArm' : 'RightArm';
    shoulder.position.set(side * d[137], d[138], d[139]);
    torso.add(shoulder);
    arms.push(shoulder);

    // Green-and-black short sleeve.
    sphere(
      shoulder, shirt,
      [side * d[140], -d[141], d[142]],
      [d[143], d[144], d[145]]
    );

    sphere(
      shoulder, green,
      [side * d[146], -d[147], d[148]],
      [d[149], d[150], d[151]]
    );

    // Upper arm and forearm.
    capsule(
      shoulder, skin,
      [d[152], -d[153], d[154]],
      [side * d[155], -d[156], d[157]],
      d[158]
    );

    const elbow = new THREE.Group();
    elbow.position.set(side * d[159], -d[160], d[161]);
    shoulder.add(elbow);
    shoulder.userData.elbow = elbow;

    capsule(
      elbow, skin,
      [d[162], d[163], d[164]],
      [side * d[165], -d[166], d[167]],
      d[168]
    );

    sphere(
      elbow, skin,
      [side * d[169], -d[170], d[171]],
      [d[172], d[173], d[174]]
    );

    // Simple hands, without individual fingers.
    sphere(
      elbow, skin,
      [side * d[175], -d[176], d[177]],
      [d[178], d[179], d[180]]
    );
  }

  // Omnitrix watch on the left wrist.
  const watch = box(
    arms[d[181]].userData.elbow,
    green,
    [d[182], -d[183], d[184]],
    [d[185], d[186], d[187]]
  );
  watch.name = 'Omnitrix';

  box(
    arms[d[188]].userData.elbow,
    watchBlack,
    [d[189], -d[190], d[191]],
    [d[192], d[193], d[194]]
  );

  // --------------------------------------------------
  // PANTS AND LEGS.
  // --------------------------------------------------

  box(body, pants, [d[195], d[196], d[197]], [d[198], d[199], d[200]]);

  const legs = [];

  for (const side of [-d[201], d[202]]) {
    const hip = new THREE.Group();
    hip.name = side < d[203] ? 'LeftLeg' : 'RightLeg';
    hip.position.set(side * d[204], d[205], d[206]);
    body.add(hip);
    legs.push(hip);

    // Wide brown trouser legs.
    capsule(
      hip, pants,
      [d[207], d[208], d[209]],
      [side * d[210], -d[211], d[212]],
      d[213],
      d[214]
    );

    // Outer trouser seam.
    capsule(
      hip, pantsDark,
      [side * d[215], -d[216], d[217]],
      [side * d[218], -d[219], d[220]],
      d[221]
    );

    // Cargo pocket on each outer thigh.
    const pocket = box(
      hip,
      pantsLight,
      [side * d[222], -d[223], d[224]],
      [d[225], d[226], d[227]]
    );
    pocket.rotation.z = side * -d[228];

    box(
      hip,
      pantsDark,
      [side * d[229], -d[230], d[231]],
      [d[232], d[233], d[234]]
    );

    // Shoe pivot.
    const foot = new THREE.Group();
    foot.name = 'Foot';
    foot.position.set(d[235], -d[236], d[237]);
    hip.add(foot);
    hip.userData.foot = foot;

    // White sneaker sole.
    box(
      foot, sole,
      [d[238], -d[239], d[240]],
      [d[241], d[242], d[243]]
    );

    // Sneaker upper.
    sphere(
      foot, shoe,
      [d[244], d[245], d[246]],
      [d[247], d[248], d[249]]
    );

    // White toe.
    sphere(
      foot, white,
      [d[250], -d[251], d[252]],
      [d[253], d[254], d[255]]
    );

    // Green sneaker accent.
    box(
      foot, green,
      [d[256], d[257], d[258]],
      [d[259], d[260], d[261]]
    );
  }

  // --------------------------------------------------
  // CHARACTER CONTROL / PROCEDURAL ANIMATION.
  // --------------------------------------------------

  let animation = 'idle';
  let elapsed = d[262];
  let verticalVelocity = d[263];
  let grounded = true;

  const baseY = d[264];

  root.position.y = baseY;

  root.userData.setAnimation = function (name) {
    const allowed = ['idle', 'walk', 'run', 'jump'];

    if (!allowed.includes(name)) {
      throw new Error(
        `Unknown Ben animation "${name}". Use: ${allowed.join(', ')}`
      );
    }

    animation = name;
  };

  root.userData.jump = function (strength = d[265]) {
    if (!grounded) return;

    verticalVelocity = strength;
    grounded = false;
    animation = 'jump';
  };

  root.userData.update = function (deltaTime) {
    const dt = Math.min(deltaTime, d[266]);
    elapsed += dt;

    const walking = animation === 'walk' || animation === 'run';
    const speed = animation === 'run' ? d[267] : d[268];
    const swing = walking ? Math.sin(elapsed * speed) : d[269];

    // Arm swing.
    arms.forEach((arm, index) => {
      const side = index === d[270] ? -d[271] : d[272];

      arm.rotation.x = walking
        ? swing * d[273] * side
        : THREE.MathUtils.damp(arm.rotation.x, d[274], d[275], dt);

      arm.userData.elbow.rotation.x = walking
        ? Math.max(d[276], -swing * side) * d[277]
        : THREE.MathUtils.damp(
            arm.userData.elbow.rotation.x, d[278], d[279], dt
          );
    });

    // Leg swing.
    legs.forEach((leg, index) => {
      const side = index === d[280] ? -d[281] : d[282];

      leg.rotation.x = walking
        ? swing * d[283] * side
        : THREE.MathUtils.damp(leg.rotation.x, d[284], d[285], dt);

      leg.userData.foot.rotation.x = walking
        ? Math.max(d[286], swing * side) * d[287]
        : THREE.MathUtils.damp(
            leg.userData.foot.rotation.x, d[288], d[289], dt
          );
    });

    // Slight torso movement while walking.
    torso.rotation.z = walking ? swing * d[290] : d[291];
    torso.position.y = d[292] + (
      walking ? Math.abs(Math.sin(elapsed * speed * d[293])) * d[294] : d[295]
    );

    // Basic gravity and jump.
    if (!grounded) {
      verticalVelocity -= d[296] * dt;
      root.position.y += verticalVelocity * dt;

      if (root.position.y <= baseY) {
        root.position.y = baseY;
        verticalVelocity = d[297];
        grounded = true;
        animation = 'idle';
      }
    }
  };

  // Convenience methods.
  root.setAnimation = root.userData.setAnimation;
  root.jump = root.userData.jump;
  root.update = root.userData.update;

  return root;
}
