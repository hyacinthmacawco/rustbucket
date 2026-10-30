// Character/vehicle selector. The large ring contains four quadrant selectors;
// the center selector switches control to the Rustbucket.
export function createTeamstick() {
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
  function onClick(event) {
    const button = event.target.closest("button[data-target]");
    if (!button) return;
    selected = button.dataset.target;
    renderSelection();
  }
  element.addEventListener("click", onClick);
  renderSelection();

  return {
    element,
    get selected() { return selected; },
    setVisible(visible) { element.style.display = visible ? "" : "none"; },
    destroy() {
      element.removeEventListener("click", onClick);
      element.remove();
    }
  };
}
