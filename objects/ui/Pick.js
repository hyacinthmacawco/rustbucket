export class Pick {
  constructor({ onPress = () => {} } = {}) { this.onPress=onPress; }
  create() { const button=document.createElement("button"); button.className="rb-control rb-pick"; button.type="button"; button.textContent="PICK"; button.addEventListener("click",()=>this.onPress()); this.element=button; return button; }
  destroy() { this.element?.remove(); this.element=null; }
}