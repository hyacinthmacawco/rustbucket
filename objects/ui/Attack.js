export class Attack {
  constructor({ onStart = () => {}, onEnd = () => {} } = {}) { this.onStart=onStart; this.onEnd=onEnd; }
  create() { const button=document.createElement("button"); button.className="rb-control rb-attack"; button.type="button"; button.textContent="ATTACK"; button.addEventListener("pointerdown",e=>{e.preventDefault();this.onStart();}); for(const name of ["pointerup","pointercancel","pointerleave"]) button.addEventListener(name,()=>this.onEnd()); this.element=button; return button; }
  destroy() { this.element?.remove(); this.element=null; }
}