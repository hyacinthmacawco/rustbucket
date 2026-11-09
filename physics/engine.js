import * as THREE from "three";
import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/+esm";

export async function createPhysics() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const floor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(260, 0.5, 260).setFriction(0.9), floor);

  const bodies = [];
  const colliders = [];

  function addStaticScene(root) {
    root.updateMatrixWorld(true);
    root.traverse(object => {
      if (!object.isMesh || !object.geometry || object.userData.noPhysics || object.material?.transparent) return;
      const bounds = new THREE.Box3().setFromObject(object);
      if (!Number.isFinite(bounds.min.x)) return;
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      if (size.x < 0.08 || size.y < 0.08 || size.z < 0.08 || size.x > 600 || size.y > 150 || size.z > 600) return;
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(center.x, center.y, center.z));
      const collider = world.createCollider(
        RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setFriction(0.85).setRestitution(0),
        body
      );
      colliders.push(collider);
    });
  }

  function addCharacter(object) {
    const position = object.position;
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(position.x, position.y + 0.75, position.z)
    );
    const collider = world.createCollider(RAPIER.ColliderDesc.capsule(0.48, 0.27).setFriction(0.8), body);
    const controller = world.createCharacterController(0.025);
    controller.setSlideEnabled(true);
    controller.setMaxSlopeClimbAngle(Math.PI / 4);
    controller.setMinSlopeSlideAngle(Math.PI / 3);
    controller.enableAutostep(0.35, 0.2, true);
    controller.enableSnapToGround(0.22);

    let verticalVelocity = 0;
    let grounded = true;
    let jumpBuffer = 0;
    object.userData.physicsBody = body;
    object.userData.moveWithCollisions = (dx, dz, dt, jumpPressed) => {
      if (jumpPressed) jumpBuffer = 0.24;
      else jumpBuffer = Math.max(0, jumpBuffer - dt);

      if (jumpBuffer > 0 && grounded) {
        verticalVelocity = 6.2;
        grounded = false;
        jumpBuffer = 0;
      }

      verticalVelocity = Math.max(-28, verticalVelocity - 9.81 * dt);
      const desired = { x: dx, y: verticalVelocity * dt, z: dz };
      controller.computeColliderMovement(collider, desired);
      const movement = controller.computedMovement();
      const current = body.translation();
      body.setNextKinematicTranslation({
        x: current.x + movement.x,
        y: current.y + movement.y,
        z: current.z + movement.z
      });

      grounded = controller.computedGrounded();
      if (grounded && verticalVelocity < 0) verticalVelocity = 0;
    };

    bodies.push({ object, body });
    return body;
  }

  function step(delta) {
    world.timestep = Math.min(delta, 1 / 30);
    world.step();
    for (const { object, body } of bodies) {
      const position = body.translation();
      object.position.set(position.x, position.y - 0.75, position.z);
    }
  }

  return {
    world, addCharacter, addStaticScene, step,
    dispose() {
      for (const entry of bodies) world.removeRigidBody(entry.body);
      world.free();
      bodies.length = 0;
      colliders.length = 0;
    }
  };
}
