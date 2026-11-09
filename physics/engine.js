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
    // A thin deck collider drives vehicle movement; surrounding panels and stair
    // colliders let characters physically board through the open starboard doorway.
    const collider = world.createCollider(
      RAPIER.ColliderDesc.cuboid(1.32,0.12,5.0).setTranslation(0,-1.4,0).setFriction(0.75), body
    );
    const vehiclePanels = [
      [RAPIER.ColliderDesc.cuboid(1.25,0.10,4.8).setTranslation(0,-0.55,0)],
      [RAPIER.ColliderDesc.cuboid(0.12,0.82,5.0).setTranslation(-1.38,0,0)],
      [RAPIER.ColliderDesc.cuboid(0.12,0.82,3.1).setTranslation(1.38,0,-1.9)],
      [RAPIER.ColliderDesc.cuboid(0.12,0.82,0.8).setTranslation(1.38,0,4.55)],
      [RAPIER.ColliderDesc.cuboid(1.32,0.12,0.12).setTranslation(0,0,-5.0)],
      [RAPIER.ColliderDesc.cuboid(1.32,0.12,0.12).setTranslation(0,0,5.0)]
    ];
    for (const [descriptor] of vehiclePanels) world.createCollider(descriptor,body);
    for (let i=0;i<5;i++) {
      const stair = RAPIER.ColliderDesc.cuboid(0.52,0.09,0.24)
        .setTranslation(2.05,-1.75+i*0.34,3.45-i*0.48).setFriction(0.9);
      world.createCollider(stair,body);
    }
    const controller = world.createCharacterController(0.04);
    controller.setSlideEnabled(true);
    const attitude = { yaw:0, pitch:0, roll:0 };
    const vehicleQuaternion = new THREE.Quaternion();
    object.userData.vehicleBody = body;
    object.userData.moveVehicle = (dx,dz,lift,dt) => {
      const current = body.translation();
      controller.computeColliderMovement(collider,{x:dx,y:lift*9.2*dt,z:dz});
      const movement = controller.computedMovement();
      body.setNextKinematicTranslation({x:current.x+movement.x,y:current.y+movement.y,z:current.z+movement.z});
      const steer = THREE.MathUtils.clamp(dx / Math.max(dt,0.001) / 18,-1,1);
      attitude.yaw = THREE.MathUtils.clamp(attitude.yaw + steer * 0.42 * dt,-0.58,0.58);
      attitude.roll = THREE.MathUtils.damp(attitude.roll,-steer*0.32,5,dt);
      attitude.pitch = THREE.MathUtils.damp(attitude.pitch,-lift*0.2,5,dt);
      vehicleQuaternion.setFromEuler(new THREE.Euler(attitude.pitch,attitude.yaw,attitude.roll,"YXZ"));
      body.setNextKinematicRotation(vehicleQuaternion);
    };
    bodies.push({object,body,vehicle:true});
    return body;
  }
  function step(delta) {
    world.timestep = Math.min(delta, 1 / 30);
    world.step();
    for (const { object, body, vehicle = false } of bodies) {
      const position = body.translation();
      object.position.set(position.x, position.y - (vehicle ? 0 : 0.75), position.z);
      if (vehicle) object.quaternion.set(body.rotation().x,body.rotation().y,body.rotation().z,body.rotation().w);
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
