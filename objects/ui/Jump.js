export class Jump {
  constructor({ onPress = () => {} } = {}) { this.onPress = onPress; }
  create() { const button=document.createElement("button"); button.className="rb-control rb-jump"; button.type="button"; button.textContent="JUMP"; button.addEventListener("pointerdown",e=>{e.preventDefault();this.onPress();}); this.element=button; return button; }
  destroy() { this.element?.remove(); this.element=null; }
}