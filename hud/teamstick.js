// Four arc selectors surround the circular Rustbucket control.
export function createTeamstick({ onSelect = () => {} } = {}) {
  const element = document.createElement("div");
  element.id = "teamstick";
  element.setAttribute("aria-label", "Select controlled character or vehicle");
  element.innerHTML = `
    <button class="teamstick-option teamstick-ben" data-target="ben" aria-label="Control Ben" title="Ben">⚡</button>
    <button class="teamstick-option teamstick-gwen" data-target="gwen" aria-label="Control Gwen" title="Gwen">✦</button>
    <button class="teamstick-option teamstick-kevin" data-target="kevin" aria-label="Control Kevin" title="Kevin">◆</button>
    <button class="teamstick-option teamstick-rook" data-target="rook" aria-label="Control Rook" title="Rook">⬟</button>
    <button class="teamstick-vehicle" data-target="rustbucket" aria-label="Control Rustbucket" title="Rustbucket">🚀</button>
  `;
  document.body.appendChild(element);
  const buttons = [...element.querySelectorAll("button")];
  let selected = "ben";
  function renderSelection() {
    for (const button of buttons) {
      const active = button.dataset.target === selected;
      button.classList.toggle("selected", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }
  function choose(target) {
    if (!["ben", "gwen", "kevin", "rook", "rustbucket"].includes(target) || target === selected) return;
    selected = target;
    renderSelection();
    onSelect(target);
  }
  function onClick(event) {
    const button = event.target.closest("button[data-target]");
    if (button) choose(button.dataset.target);
  }
  element.addEventListener("click", onClick);
  renderSelection();
  return {
    element,
    get selected() { return selected; },
    select: choose,
    setVisible(visible) { element.style.display = visible ? "" : "none"; },
    destroy() { element.removeEventListener("click", onClick); element.remove(); }
  };
}
