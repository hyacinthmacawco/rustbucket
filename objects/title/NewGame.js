export class NewGame {
  constructor({ onSelect = () => {} } = {}) { this.onSelect=onSelect; }
  create() { const button=document.createElement("button"); button.type="button"; button.className="rb-title-action"; button.textContent="NEW GAME"; button.addEventListener("click",()=>this.onSelect()); this.element=button; return button; }
  destroy() { this.element?.remove(); this.element=null; }
}