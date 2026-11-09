import * as THREE from "three";
import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/+esm";
export async function createPhysics(){
 await RAPIER.init();
 const world=new RAPIER.World({x:0,y:-9.81,z:0}),floor=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.5,0));
 world.createCollider(RAPIER.ColliderDesc.cuboid(260,.5,260).setFriction(.9),floor);
 const bodies=[],colliders=[];
 function addStaticScene(root){
  root.updateMatrixWorld(true);
  root.traverse(o=>{
   if(!o.isMesh||!o.geometry||o.userData.noPhysics||o.material?.transparent)return;
   const b=new THREE.Box3().setFromObject(o);if(!Number.isFinite(b.min.x))return;
   const s=b.getSize(new THREE.Vector3()),p=b.getCenter(new THREE.Vector3());
   if(s.x<.08||s.y<.08||s.z<.08||s.x>600||s.y>150||s.z>600)return;
   const rb=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(p.x,p.y,p.z));
   const col=world.createCollider(RAPIER.ColliderDesc.cuboid(s.x/2,s.y/2,s.z/2).setFriction(.85).setRestitution(0),rb);colliders.push(col);
  });
 }
 function addCharacter(object){
  const pos=object.position,body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(pos.x,pos.y+.75,pos.z));
  const collider=world.createCollider(RAPIER.ColliderDesc.capsule(.48,.27).setFriction(.8),body);
  const controller=world.createCharacterController(.025);controller.setSlideEnabled(true);controller.setMaxSlopeClimbAngle(Math.PI/4);controller.setMinSlopeSlideAngle(Math.PI/3);controller.enableAutostep(.35,.2,true);controller.enableSnapToGround(.18);
  let verticalVelocity=0,grounded=false;
  object.userData.physicsBody=body;
  object.userData.moveWithCollisions=(dx,dz,dt,jump)=>{
   if(jump&&grounded){verticalVelocity=5.3;grounded=false;}
   verticalVelocity-=9.81*dt;
   const desired={x:dx,y:verticalVelocity*dt,z:dz};
   controller.computeColliderMovement(collider,desired);
   const movement=controller.computedMovement(),current=body.translation();
   body.setNextKinematicTranslation({x:current.x+movement.x,y:current.y+movement.y,z:current.z+movement.z});
   grounded=controller.computedGrounded();if(grounded&&verticalVelocity<0)verticalVelocity=0;
  };
  bodies.push({object,body});return body;
 }
 function step(dt){world.timestep=Math.min(dt,1/30);world.step();for(const {object,body} of bodies){const p=body.translation();object.position.set(p.x,p.y-.75,p.z);}}
 return {world,addCharacter,addStaticScene,step,dispose(){for(const b of bodies)world.removeRigidBody(b.body);world.free();bodies.length=0;colliders.length=0;}};
}
