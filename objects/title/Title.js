// The title module owns only the title-screen DOM and its controls.
// The Omniverse scene, camera, animation loop, and music are managed by index.html.

export function createTitleScreen({ onNewGame = () => {} } = {}) {
  const screen = document.createElement("main");
  screen.id = "title-screen";
  screen.innerHTML = `
    <section id="title-menu" aria-label="Main menu">
      <h1 id="game-title">RUSTBUCKET</h1>
      <div id="title-buttons">
        <button id="new-game-button" type="button">NEW GAME</button>
        <button id="load-game-button" type="button" aria-label="Load game" aria-expanded="false">
          <span>LOAD GAME</span>
          <svg class="chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      </div>
      <div id="load-game-panel" hidden><p>NO SAVED GAMES</p></div>
    </section>
  `;

  const newGameButton = screen.querySelector("#new-game-button");
  const loadGameButton = screen.querySelector("#load-game-button");
  const loadGamePanel = screen.querySelector("#load-game-panel");

  function handleNewGame() {
    onNewGame();
    screen.dispatchEvent(new CustomEvent("rustbucket:newgame", { bubbles: true }));
  }

  function handleLoadGame() {
    const expanded = loadGameButton.getAttribute("aria-expanded") === "true";
    loadGameButton.setAttribute("aria-expanded", String(!expanded));
    loadGamePanel.hidden = expanded;
  }

  newGameButton.addEventListener("click", handleNewGame);
  loadGameButton.addEventListener("click", handleLoadGame);
  document.body.appendChild(screen);

  return {
    element: screen,
    setVisible(visible) {
      screen.hidden = !visible;
      screen.style.display = visible ? "block" : "none";
    },
    destroy() {
      newGameButton.removeEventListener("click", handleNewGame);
      loadGameButton.removeEventListener("click", handleLoadGame);
      screen.remove();
    }
  };
}
