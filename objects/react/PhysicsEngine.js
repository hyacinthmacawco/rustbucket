import * as THREE from "three";
import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/+esm";

export class PhysicsEngine {
  constructor() {
    this.world = null;
    this.bodies = [];
    this.colliders = [];
    this.bounds = new THREE.Box3();
    this.size = new THREE.Vector3();
    this.center = new THREE.Vector3();
    this.environment = "planet";
  }

  static async create() {
    const engine = new PhysicsEngine();
    await engine.initialize();
    return engine;
  }

  async initialize() {
await RAPIER.init();
  this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const floor = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0));
  this.world.createCollider(RAPIER.ColliderDesc.cuboid(260, 0.5, 260).setFriction(0.9), floor);
  }

addStaticScene(root) {
    root.updateMatrixWorld(true);
    root.traverse(object => {
      if (!object.isMesh || !object.geometry || object.userData.noPhysics || object.material?.transparent) return;
      this.bounds.setFromObject(object);
      if (!Number.isFinite(this.bounds.min.x)) return;
      this.bounds.getSize(this.size);
      this.bounds.getCenter(this.center);
      if (this.size.x < 0.3 || this.size.y < 0.3 || this.size.z < 0.3 || this.size.x > 600 || this.size.y > 150 || this.size.z > 600) return;
      const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(this.center.x, this.center.y, this.center.z));
      const collider = this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(this.size.x / 2, this.size.y / 2, this.size.z / 2).setFriction(0.85),
        body
      );
      this.colliders.push(collider);
    });
  }

addCharacter(object) {
    const p = object.position;
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x,p.y+0.75,p.z));
    const collider = this.world.createCollider(RAPIER.ColliderDesc.capsule(0.48,0.27).setFriction(0.8),body);
    const controller = this.world.createCharacterController(0.025);
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
    this.bodies.push({object,body,kind:"character"});
    return body;
  }

addVehicle(object) {
    const p=object.position, scale=object.scale.x||1;
    const s=value=>value*scale;
    const body=this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z)
        .setLinearDamping(0).setAngularDamping(0).setCanSleep(false)
    );
    body.setGravityScale(0,true);
    // Only the hull walls collide. There is deliberately no collider across
    // the cabin floor or interior, so passengers can walk through the ship.
    const walls=[
      RAPIER.ColliderDesc.cuboid(s(0.12),s(0.82),s(5.0)).setTranslation(s(-1.38),0,0),
      RAPIER.ColliderDesc.cuboid(s(0.12),s(0.82),s(5.0)).setTranslation(s(1.38),0,0),
      RAPIER.ColliderDesc.cuboid(s(1.32),s(0.82),s(0.12)).setTranslation(0,0,s(5.0)),
      RAPIER.ColliderDesc.cuboid(s(1.36),s(0.09),s(5.15)).setTranslation(0,s(1.28),0),
      // External landing skids support the hull without creating a floor inside the cabin.
      RAPIER.ColliderDesc.cuboid(s(0.16),s(0.12),s(0.52)).setTranslation(s(-0.92),s(-1.12),s(-3.35)),
      RAPIER.ColliderDesc.cuboid(s(0.16),s(0.12),s(0.52)).setTranslation(s(0.92),s(-0.82),s(-3.35)),
      RAPIER.ColliderDesc.cuboid(s(0.16),s(0.12),s(0.52)).setTranslation(0,s(-0.82),s(3.0))
    ];
    for(const desc of walls) this.world.createCollider(desc,body);
    const attitude={yaw:0,pitch:0,roll:0};
    const q=new THREE.Quaternion();
    object.userData.vehicleBody=body;
    object.userData.moveVehicle=(worldX,worldZ,lift,dt,steerInput=0,heading=attitude.yaw)=>{
      const velocity=body.linvel();
      const inSpace=this.environment==="space";
      const maxHorizontal=inSpace?30000:22;
      const maxVertical=inSpace?14000:14;
      const acceleration=inSpace?42000:34;
      const verticalAcceleration=inSpace?26000:26;
      const drag=inSpace?0.045:1.05;
      const inputMagnitude=Math.min(1,Math.hypot(worldX,worldZ));
      let vx=velocity.x, vz=velocity.z, vy=velocity.y;
      if(inputMagnitude>0.045){
        const targetX=THREE.MathUtils.clamp(worldX,-1,1)*maxHorizontal;
        const targetZ=THREE.MathUtils.clamp(worldZ,-1,1)*maxHorizontal;
        const change=acceleration*dt;
        vx+=THREE.MathUtils.clamp(targetX-vx,-change,change);
        vz+=THREE.MathUtils.clamp(targetZ-vz,-change,change);
      }else{
        const coast=Math.exp(-drag*dt);
        vx*=coast; vz*=coast;
      }
      const horizontalLength=Math.hypot(vx,vz);
      if(horizontalLength>maxHorizontal){vx*=maxHorizontal/horizontalLength;vz*=maxHorizontal/horizontalLength;}
      const targetY=THREE.MathUtils.clamp(lift,-1,1)*maxVertical;
      if(Math.abs(lift)>0.045) vy+=THREE.MathUtils.clamp(targetY-vy,-verticalAcceleration*dt,verticalAcceleration*dt);
      else vy*=Math.exp(-(inSpace?0.075:1.25)*dt);
      body.setLinvel({x:vx,y:THREE.MathUtils.clamp(vy,-maxVertical,maxVertical),z:vz},true);
      const yawDifference=Math.atan2(Math.sin(heading-attitude.yaw),Math.cos(heading-attitude.yaw));
      attitude.yaw+=yawDifference*Math.min(1,dt*2.6);
      const forwardThrust=worldX*Math.sin(heading)+worldZ*Math.cos(heading);
      const sideThrust=worldX*Math.cos(heading)-worldZ*Math.sin(heading);
      const targetRoll=THREE.MathUtils.clamp(-sideThrust*0.48,-0.48,0.48);
      const targetPitch=THREE.MathUtils.clamp(-forwardThrust*0.14+lift*0.12,-0.28,0.28);
      attitude.roll=THREE.MathUtils.damp(attitude.roll,targetRoll,2.8,dt);
      attitude.pitch=THREE.MathUtils.damp(attitude.pitch,targetPitch,2.4,dt);
      q.setFromEuler(new THREE.Euler(attitude.pitch,attitude.yaw,attitude.roll,"YXZ"));
      body.setRotation({x:q.x,y:q.y,z:q.z,w:q.w},true);
    };
    this.bodies.push({object,body,kind:"vehicle"});
    return body;
  }

setEnvironment(next) {
    this.environment=next==="space"?"space":"planet";
    for(const entry of this.bodies){
      if(entry.kind!=="vehicle")continue;
      entry.body.setGravityScale(0,true);
      entry.body.setLinearDamping(this.environment==="space"?0.005:0.035);
      entry.body.setAngularDamping(this.environment==="space"?0.04:0.12);
    }
  }

step(delta) {
    this.world.timestep=Math.min(delta,1/30);
    this.world.step();
    for(const {object,body,kind} of this.bodies){
      const p=body.translation();
      object.position.set(p.x,p.y-(kind==="character"?0.75:0),p.z);
      if(kind==="vehicle"){
        const r=body.rotation();
        object.quaternion.set(r.x,r.y,r.z,r.w);
      }
    }
  }

  dispose() {
    for (const entry of this.bodies) this.world.removeRigidBody(entry.body);
    this.world.free();
    this.bodies.length = 0;
    this.colliders.length = 0;
  }
}
