export class Pause {
  constructor({ onToggle = () => {} } = {}) { this.onToggle=onToggle; }
  create() { const button=document.createElement("button"); button.className="rb-control rb-pause"; button.type="button"; button.textContent="Ⅱ"; button.setAttribute("aria-label","Pause"); button.addEventListener("click",()=>this.onToggle()); this.element=button; return button; }
  destroy() { this.element?.remove(); this.element=null; }
}