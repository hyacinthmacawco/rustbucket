export default function createGwen(THREE) {
    const root = new THREE.Group();
    root.name = "Gwen";

    const mat = (color, roughness = 0.85) =>
        new THREE.MeshStandardMaterial({ color, roughness });

    const skin = mat(0xe8b9a7);
    const hair = mat(0xc95b19);
    const hairLight = mat(0xe77b28);
    const shirt = mat(0x9bd5ed);
    const blue = mat(0x376b9e);
    const darkBlue = mat(0x244c77);
    const white = mat(0xe5edf0);
    const skirtMat = mat(0x315d91);
    const black = mat(0x172333);
    const glasses = mat(0x173c68);
    const eye = mat(0x245a85);
    const mouth = mat(0x873d4b);

    function mesh(geo, material, parent, x, y, z) {
        const m = new THREE.Mesh(geo, material);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
    }

    function ellipsoid(parent, material, x, y, z, sx, sy, sz) {
        const m = mesh(
            new THREE.SphereGeometry(1, 16, 12),
            material, parent, x, y, z
        );
        m.scale.set(sx, sy, sz);
        return m;
    }

    function box(parent, material, x, y, z, sx, sy, sz) {
        const m = mesh(
            new THREE.BoxGeometry(sx, sy, sz),
            material, parent, x, y, z
        );
        return m;
    }

    function limb(parent, material, a, b, radius) {
        const start = new THREE.Vector3(...a);
        const end = new THREE.Vector3(...b);
        const direction = new THREE.Vector3().subVectors(end, start);
        const m = mesh(
            new THREE.CylinderGeometry(radius * 0.85, radius, direction.length(), 12),
            material,
            parent,
            ...(start.clone().add(end).multiplyScalar(0.5).toArray())
        );
        m.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.normalize()
        );
        return m;
    }

    // Legs
    const leftLeg = new THREE.Group();
    const rightLeg = new THREE.Group();

    leftLeg.position.set(-0.19, 1.75, 0);
    rightLeg.position.set(0.19, 1.75, 0);

    root.add(leftLeg, rightLeg);

    for (const leg of [leftLeg, rightLeg]) {
        ellipsoid(leg, skin, 0, -0.34, 0, 0.115, 0.37, 0.12);

        // White knee-high socks
        ellipsoid(leg, white, 0, -0.83, 0, 0.12, 0.43, 0.13);

        // Blue shoes
        ellipsoid(leg, blue, 0, -1.25, 0.09, 0.17, 0.12, 0.28);
        ellipsoid(leg, darkBlue, 0, -1.33, 0.09, 0.17, 0.035, 0.28);
    }

    // Torso
    const torso = new THREE.Group();
    torso.position.y = 2.45;
    root.add(torso);

    ellipsoid(torso, shirt, 0, 0, 0, 0.34, 0.48, 0.19);

    // Shirt collar
    ellipsoid(torso, blue, 0, 0.40, 0, 0.16, 0.07, 0.17);

    // Gwen's shirt emblem
    const emblem = mat(0x294f80);
    ellipsoid(torso, emblem, -0.105, 0.12, 0.193, 0.085, 0.11, 0.025);
    ellipsoid(torso, emblem, 0.105, 0.12, 0.193, 0.085, 0.11, 0.025);

    box(torso, white, 0, 0.11, 0.217, 0.035, 0.12, 0.012);

    // Neck
    ellipsoid(root, skin, 0, 2.94, 0, 0.105, 0.18, 0.11);

    // Head
    const head = new THREE.Group();
    head.position.set(0, 3.17, 0);
    root.add(head);

    ellipsoid(head, skin, 0, 0, 0, 0.23, 0.30, 0.19);

    // Jaw and chin
    ellipsoid(head, skin, 0, -0.16, 0.025, 0.17, 0.13, 0.15);

    // Nose
    ellipsoid(head, skin, 0, -0.015, 0.185, 0.035, 0.065, 0.035);

    // Eyes
    for (const x of [-0.095, 0.095]) {
        ellipsoid(head, white, x, 0.045, 0.165, 0.065, 0.045, 0.035);
        ellipsoid(head, eye, x, 0.045, 0.197, 0.035, 0.032, 0.015);
        ellipsoid(head, black, x, 0.045, 0.208, 0.012, 0.023, 0.008);
    }

    // Blue glasses
    for (const x of [-0.095, 0.095]) {
        const frame = mesh(
            new THREE.TorusGeometry(0.075, 0.012, 6, 20),
            glasses, head, x, 0.045, 0.205
        );
        frame.scale.y = 0.65;
    }

    box(head, glasses, 0, 0.045, 0.205, 0.055, 0.014, 0.018);

    // Eyebrows
    for (const x of [-0.095, 0.095]) {
        const brow = box(head, hair, x, 0.115, 0.17, 0.075, 0.018, 0.025);
        brow.rotation.z = x < 0 ? 0.12 : -0.12;
    }

    // Mouth
    ellipsoid(head, mouth, 0, -0.14, 0.17, 0.055, 0.012, 0.012);

    // Orange hair cap
    ellipsoid(head, hair, 0, 0.235, -0.015, 0.27, 0.16, 0.22);

    // Side hair
    for (const x of [-1, 1]) {
        const side = ellipsoid(
            head, hair, x * 0.22, 0.015, -0.005,
            0.095, 0.23, 0.18
        );
        side.rotation.z = x * -0.15;

        // Hair tips
        const tip = ellipsoid(
            head, hairLight, x * 0.24, -0.13, 0.015,
            0.07, 0.12, 0.12
        );
        tip.rotation.z = x * -0.25;
    }

    // Front hair fringe
    ellipsoid(head, hairLight, -0.13, 0.19, 0.16, 0.12, 0.11, 0.08);
    ellipsoid(head, hair, 0.035, 0.20, 0.17, 0.12, 0.09, 0.07);

    // Back hair
    ellipsoid(head, hair, 0, 0.02, -0.17, 0.25, 0.27, 0.10);

    // Skirt
    const skirt = mesh(
        new THREE.CylinderGeometry(0.28, 0.38, 0.46, 12),
        skirtMat, root, 0, 1.96, 0
    );

    // Checked skirt pattern
    const lineMat = mat(0x83a7c9);
    for (let i = -2; i <= 2; i++) {
        const line = box(
            root, lineMat,
            i * 0.11, 1.96, 0.355,
            0.012, 0.42, 0.008
        );
    }

    for (const y of [1.82, 1.96, 2.10]) {
        box(root, lineMat, 0, y, 0.355, 0.65, 0.012, 0.008);
    }

    // Arms
    const leftArm = new THREE.Group();
    const rightArm = new THREE.Group();

    leftArm.position.set(-0.34, 2.72, 0);
    rightArm.position.set(0.34, 2.72, 0);

    torso.add(leftArm, rightArm);

    for (const [arm, side] of [[leftArm, -1], [rightArm, 1]]) {
        limb(arm, shirt, [0, 0, 0], [side * 0.08, -0.42, 0], 0.105);
        limb(arm, skin, [side * 0.08, -0.42, 0], [side * 0.13, -0.91, 0.02], 0.075);

        ellipsoid(arm, skin, side * 0.13, -1.0, 0.04, 0.09, 0.12, 0.07);

        // Fingers
        for (let i = -1; i <= 1; i++) {
            limb(
                arm, skin,
                [side * (0.13 + i * 0.035), -1.03, 0.04],
                [side * (0.14 + i * 0.04), -1.15, 0.06],
                0.018
            );
        }
    }

    // Animation
    let animation = "idle";
    let elapsed = 0;
    let jumpVelocity = 0;
    let verticalOffset = 0;

    root.userData.setAnimation = (name) => {
        animation = name;
    };

    root.userData.jump = (strength = 4.8) => {
        if (verticalOffset <= 0.001) jumpVelocity = strength;
        animation = "jump";
    };

    root.userData.update = (dt) => {
        elapsed += dt;

        const moving = animation === "walk" || animation === "run";
        const speed = animation === "run" ? 11 : 6;
        const swing = moving ? Math.sin(elapsed * speed) * 0.55 : 0;

        leftLeg.rotation.x = swing;
        rightLeg.rotation.x = -swing;

        leftArm.rotation.x = -swing * 0.55;
        rightArm.rotation.x = swing * 0.55;

        torso.position.y = 2.45 + (moving ? Math.abs(swing) * 0.025 : 0);

        if (jumpVelocity !== 0 || verticalOffset > 0) {
            jumpVelocity -= 12 * dt;
            verticalOffset += jumpVelocity * dt;

            if (verticalOffset <= 0) {
                verticalOffset = 0;
                jumpVelocity = 0;
                animation = "idle";
            }
        }

        root.position.y = verticalOffset;

        if (!moving && animation === "idle") {
            torso.rotation.z = Math.sin(elapsed * 1.5) * 0.015;
        } else {
            torso.rotation.z = 0;
        }
    };

    root.userData.setAnimation("idle");
    return root;
}
