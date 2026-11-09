import * as THREE from "three";
import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/+esm";

export async function createPhysics() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const floor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(260, 0.5, 260).setFriction(0.9), floor);

  const bodies = [];
  const colliders = [];
  const bounds = new THREE.Box3();
  const sizeVector = new THREE.Vector3();
  const centerVector = new THREE.Vector3();

  function addStaticScene(root) {
    root.updateMatrixWorld(true);
    root.traverse(object => {
      if (!object.isMesh || !object.geometry || object.userData.noPhysics || object.material?.transparent) return;
      bounds.setFromObject(object);
      if (!Number.isFinite(bounds.min.x)) return;
      bounds.getSize(sizeVector);
      bounds.getCenter(centerVector);
      if (sizeVector.x < 0.3 || sizeVector.y < 0.3 || sizeVector.z < 0.3 || sizeVector.x > 600 || sizeVector.y > 150 || sizeVector.z > 600) return;
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(centerVector.x, centerVector.y, centerVector.z));
      const collider = world.createCollider(
        RAPIER.ColliderDesc.cuboid(sizeVector.x / 2, sizeVector.y / 2, sizeVector.z / 2).setFriction(0.85).setRestitution(0),
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
    controller.enableSnapToGround(0.32);

    let verticalVelocity = 0;
    let grounded = false;
    let jumpBuffer = 0;
    let coyoteTime = 0;
    object.userData.physicsBody = body;
    object.userData.requestJump = () => { jumpBuffer = 0.24; };
    object.userData.moveWithCollisions = (dx, dz, dt) => {
      const stepDt = Math.min(Math.max(dt, 1 / 120), 1 / 20);
      if (jumpBuffer > 0 && (grounded || coyoteTime > 0)) {
        verticalVelocity = 4.8;
        grounded = false;
        coyoteTime = 0;
        jumpBuffer = 0;
      } else {
        jumpBuffer = Math.max(0, jumpBuffer - stepDt);
      }

      verticalVelocity = Math.max(-24, verticalVelocity - 9.81 * stepDt);
      const desired = { x: dx, y: verticalVelocity * stepDt, z: dz };
      controller.computeColliderMovement(collider, desired);
      const movement = controller.computedMovement();
      const current = body.translation();
      body.setNextKinematicTranslation({
        x: current.x + movement.x,
        y: current.y + movement.y,
        z: current.z + movement.z
      });

      grounded = controller.computedGrounded();
      if (grounded) {
        coyoteTime = 0.14;
        if (verticalVelocity < 0) verticalVelocity = 0;
      } else {
        coyoteTime = Math.max(0, coyoteTime - stepDt);
      }
    };

    bodies.push({ object, body });
    return body;
  }

  function addVehicle(object) {
    const p = object.position;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x,p.y,p.z));
    const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(1.65,0.85,5.5).setFriction(0.75),body);
    const controller = world.createCharacterController(0.04);
    controller.setSlideEnabled(true);
    object.userData.vehicleBody = body;
    object.userData.moveVehicle = (dx,dz,lift,dt) => {
      const current = body.translation();
      controller.computeColliderMovement(collider,{x:dx,y:lift*5.5*dt,z:dz});
      const movement = controller.computedMovement();
      body.setNextKinematicTranslation({x:current.x+movement.x,y:current.y+movement.y,z:current.z+movement.z});
    };
    bodies.push({object,body,vehicle:true});
    return body;
  }
  function step(delta) {
    world.timestep = Math.min(delta, 1 / 30);
    world.step();
    for (const { object, body } of bodies) {
      const position = body.translation();
      object.position.set(position.x, position.y - (bodies.find(entry => entry.body === body)?.vehicle ? 0 : 0.75), position.z);
    }
  }

  return {
    world, addCharacter, addVehicle, addStaticScene, step,
    dispose() {
      for (const entry of bodies) world.removeRigidBody(entry.body);
      world.free();
      bodies.length = 0;
      colliders.length = 0;
    }
  };
}
