import { NewGame } from "./NewGame.js";
import { LoadGame } from "./LoadGame.js";

export class Title {
  constructor({ onNewGame = () => {}, onSkipPrelude = () => {} } = {}) {
    this.onNewGame = onNewGame;
    this.onSkipPrelude = onSkipPrelude;
    this.styles = {
      screen: { position: "fixed", inset: "0", display: "grid", placeItems: "center", zIndex: "20", pointerEvents: "none" },
      menu: { width: "min(88vw, 560px)", display: "grid", justifyItems: "center", gap: "22px", pointerEvents: "auto", textAlign: "center" },
      heading: { margin: "0", color: "#f5fff7", fontFamily: "Industry, sans-serif", fontSize: "clamp(2.2rem, 8vw, 5.5rem)", fontWeight: "700", letterSpacing: ".08em", textShadow: "0 0 28px rgba(83,255,151,.32)" },
      buttons: { display: "grid", width: "min(78vw, 320px)", gap: "12px" },
      panel: { color: "#a9e9bd", letterSpacing: ".12em", fontSize: "1rem" }
    };

    this.element = document.createElement("main");
    this.element.id = "title-screen";
    this.element.style.position = this.styles.screen.position;
    this.element.style.inset = this.styles.screen.inset;
    this.element.style.display = this.styles.screen.display;
    this.element.style.placeItems = this.styles.screen.placeItems;
    this.element.style.zIndex = this.styles.screen.zIndex;
    this.element.style.pointerEvents = this.styles.screen.pointerEvents;

    this.menu = document.createElement("section");
    this.menu.id = "title-menu";
    Object.assign(this.menu.style, this.styles.menu);

    this.heading = document.createElement("h1");
    this.heading.id = "game-title";
    this.heading.textContent = "RUSTBUCKET";
    Object.assign(this.heading.style, this.styles.heading);

    this.buttons = document.createElement("div");
    this.buttons.id = "title-buttons";
    Object.assign(this.buttons.style, this.styles.buttons);

    this.newGame = new NewGame({ onSelect: () => this.onNewGame(), onSkip: () => this.onSkipPrelude() });
    this.loadGame = new LoadGame();
    this.buttons.append(this.newGame.create(), this.loadGame.create());

    this.menu.append(this.heading, this.buttons, this.loadGame.panel);
    this.element.append(this.menu);
    document.body.append(this.element);

    this.deathScreen = document.createElement("section");
    this.deathScreen.id = "death-screen";
    Object.assign(this.deathScreen.style, { position: "fixed", inset: "0", display: "none", placeItems: "center", background: "#000", color: "#fff", zIndex: "100", fontSize: "clamp(2rem, 8vw, 5rem)", letterSpacing: ".18em" });
    this.deathScreen.textContent = "YOU ARE DEAD";
    document.body.append(this.deathScreen);
  }

  setVisible(visible) {
    this.element.hidden = !visible;
    this.element.style.display = visible ? "grid" : "none";
  }

  setDeathVisible(visible) {
    this.deathScreen.style.display = visible ? "grid" : "none";
  }

  destroy() {
    this.newGame.destroy();
    this.loadGame.destroy();
    this.element.remove();
    this.deathScreen.remove();
  }
}