import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/+esm";
export async function createPhysics(){await RAPIER.init();const world=new RAPIER.World({x:0,y:-9.81,z:0});const floor=world.createRigidBody(RAPIER.RigidBodyDesc.fixed());world.createCollider(RAPIER.ColliderDesc.cuboid(260,.5,260).setTranslation(0,-.7,0),floor);const bodies=[];
function addCharacter(object){const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(object.position.x,object.position.y+.9,object.position.z));world.createCollider(RAPIER.ColliderDesc.capsule(.65,.32).setFriction(.8),body);object.userData.physicsBody=body;bodies.push({object,body});return body;}
function step(dt){world.timestep=Math.min(dt,1/30);world.step();for(const {object,body} of bodies){const p=body.translation();object.position.set(p.x,p.y-.9,p.z);}}
return {world,addCharacter,step,dispose(){world.free();bodies.length=0;}};}
