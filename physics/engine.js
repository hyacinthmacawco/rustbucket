import * as THREE from "three";
import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/+esm";

export async function createPhysics() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const floor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(260, 0.5, 260).setFriction(0.9), floor);

  const bodies = [];
  const colliders = [];
  const bounds = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  let environment = "planet";

  function addStaticScene(root) {
    root.updateMatrixWorld(true);
    root.traverse(object => {
      if (!object.isMesh || !object.geometry || object.userData.noPhysics || object.material?.transparent) return;
      bounds.setFromObject(object);
      if (!Number.isFinite(bounds.min.x)) return;
      bounds.getSize(size);
      bounds.getCenter(center);
      if (size.x < 0.3 || size.y < 0.3 || size.z < 0.3 || size.x > 600 || size.y > 150 || size.z > 600) return;
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(center.x, center.y, center.z));
      const collider = world.createCollider(
        RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setFriction(0.85),
        body
      );
      colliders.push(collider);
    });
  }

  function addCharacter(object) {
    const p = object.position;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x,p.y+0.75,p.z));
    const collider = world.createCollider(RAPIER.ColliderDesc.capsule(0.48,0.27).setFriction(0.8),body);
    const controller = world.createCharacterController(0.025);
    controller.setSlideEnabled(true);
    controller.setMaxSlopeClimbAngle(Math.PI/4);
    controller.setMinSlopeSlideAngle(Math.PI/3);
    controller.enableAutostep(0.35,0.2,true);
    controller.enableSnapToGround(0.32);
    let verticalVelocity=0, grounded=false, jumpBuffer=0, coyoteTime=0;
    object.userData.physicsBody=body;
    object.userData.requestJump=()=>{jumpBuffer=0.24;};
    object.userData.moveWithCollisions=(dx,dz,dt)=>{
      const stepDt=Math.min(Math.max(dt,1/120),1/20);
      if(jumpBuffer>0&&(grounded||coyoteTime>0)){verticalVelocity=4.8;grounded=false;coyoteTime=0;jumpBuffer=0;}
      else jumpBuffer=Math.max(0,jumpBuffer-stepDt);
      verticalVelocity=Math.max(-24,verticalVelocity-9.81*stepDt);
      controller.computeColliderMovement(collider,{x:dx,y:verticalVelocity*stepDt,z:dz});
      const movement=controller.computedMovement(), current=body.translation();
      body.setNextKinematicTranslation({x:current.x+movement.x,y:current.y+movement.y,z:current.z+movement.z});
      grounded=controller.computedGrounded();
      if(grounded){coyoteTime=0.14;if(verticalVelocity<0)verticalVelocity=0;}
      else coyoteTime=Math.max(0,coyoteTime-stepDt);
    };
    bodies.push({object,body,kind:"character"});
    return body;
  }

  function addVehicle(object) {
    const p=object.position, scale=object.scale.x||1;
    const s=value=>value*scale;
    const body=world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z)
        .setLinearDamping(0).setAngularDamping(0).setCanSleep(false)
    );
    body.setGravityScale(environment==="space"?0:1,true);
    // Only the hull walls collide. There is deliberately no collider across
    // the cabin floor or interior, so passengers can walk through the ship.
    const walls=[
      RAPIER.ColliderDesc.cuboid(s(0.12),s(0.82),s(5.0)).setTranslation(s(-1.38),0,0),
      RAPIER.ColliderDesc.cuboid(s(0.12),s(0.82),s(5.0)).setTranslation(s(1.38),0,0),
      RAPIER.ColliderDesc.cuboid(s(1.32),s(0.82),s(0.12)).setTranslation(0,0,s(5.0)),
      // External landing skids support the hull without creating a floor inside the cabin.
      RAPIER.ColliderDesc.cuboid(s(0.16),s(0.12),s(0.52)).setTranslation(s(-0.92),s(-0.82),s(-3.35)),
      RAPIER.ColliderDesc.cuboid(s(0.16),s(0.12),s(0.52)).setTranslation(s(0.92),s(-0.82),s(-3.35)),
      RAPIER.ColliderDesc.cuboid(s(0.16),s(0.12),s(0.52)).setTranslation(0,s(-0.82),s(3.0))
    ];
    for(const desc of walls) world.createCollider(desc,body);
    const attitude={yaw:0,pitch:0,roll:0};
    const q=new THREE.Quaternion();
    object.userData.vehicleBody=body;
    object.userData.moveVehicle=(forward,right,lift,dt,steerInput=0,heading=attitude.yaw)=>{
      const thrust=environment==="space"?15:22;
      body.applyImpulse({x:forward*thrust*dt,y:lift*thrust*dt,z:right*thrust*dt},true);
      attitude.yaw=heading;
      attitude.roll=THREE.MathUtils.damp(attitude.roll,THREE.MathUtils.clamp(steerInput,-1,1)*0.32,5,dt);
      attitude.pitch=THREE.MathUtils.damp(attitude.pitch,-lift*0.2,5,dt);
      q.setFromEuler(new THREE.Euler(attitude.pitch,attitude.yaw,attitude.roll,"YXZ"));
      body.setRotation({x:q.x,y:q.y,z:q.z,w:q.w},true);
    };
    bodies.push({object,body,kind:"vehicle"});
    return body;
  }

  function setEnvironment(next) {
    environment=next==="space"?"space":"planet";
    for(const entry of bodies){
      if(entry.kind!=="vehicle")continue;
      entry.body.setGravityScale(environment==="space"?0:1,true);
      entry.body.setLinearDamping(environment==="space"?0:0.12);
      entry.body.setAngularDamping(environment==="space"?0:0.25);
    }
  }

  function step(delta) {
    world.timestep=Math.min(delta,1/30);
    world.step();
    for(const {object,body,kind} of bodies){
      const p=body.translation();
      object.position.set(p.x,p.y-(kind==="character"?0.75:0),p.z);
      if(kind==="vehicle"){
        const r=body.rotation();
        object.quaternion.set(r.x,r.y,r.z,r.w);
      }
    }
  }

  return {
    world,addCharacter,addVehicle,addStaticScene,setEnvironment,step,
    dispose(){for(const entry of bodies)world.removeRigidBody(entry.body);world.free();bodies.length=0;colliders.length=0;}
  };
}