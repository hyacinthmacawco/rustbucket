export class Omnipedia {
  constructor({ systems = {}, onJumpSystem = () => {} } = {}) {
    this.systems = systems;
    this.onJumpSystem = onJumpSystem;
    this.currentLocation = "earth";
    this.container = null;
    this.detail = null;
    this.locationMarker = null;
    this.allowSystemJump = false;
    this.styles = {
      title: {
        margin: "0 0 20px",
        color: "#9effb6",
        fontFamily: "Nulshock, sans-serif",
        letterSpacing: ".12em",
        fontSize: "1.25rem"
      },
      grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "14px"
      },
      button: {
        minHeight: "100px",
        padding: "18px",
        border: "1px solid rgba(126,255,168,.35)",
        borderRadius: "8px",
        background: "rgba(5,35,18,.78)",
        color: "#eaffef",
        font: "inherit",
        letterSpacing: ".08em",
        textAlign: "left",
        cursor: "pointer"
      },
      card: {
        marginTop: "18px",
        padding: "18px",
        border: "1px solid rgba(126,255,168,.28)",
        borderRadius: "8px",
        background: "rgba(5,30,16,.72)",
        color: "#eaffef"
      }
    };
  }

  render(container, { allowSystemJump = false, currentLocation = this.currentLocation } = {}) {
    this.container = container;
    this.allowSystemJump = allowSystemJump;
    this.currentLocation = currentLocation;
    container.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = "OMNIPEDIA";
    Object.assign(title.style, this.styles.title);

    const grid = document.createElement("div");
    Object.assign(grid.style, this.styles.grid);

    this.detail = document.createElement("article");
    Object.assign(this.detail.style, this.styles.card);

    this.locationMarker = document.createElement("p");
    this.locationMarker.textContent = "CURRENT LOCATION";

    for (const [key, system] of Object.entries(this.systems)) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = system.name;
      Object.assign(button.style, this.styles.button);
      button.addEventListener("click", () => this.selectSystem(key));
      grid.append(button);
    }

    container.append(title, grid, this.locationMarker, this.detail);
    this.selectSystem("solar");
    this.setLocation(this.currentLocation);
  }

  selectSystem(key) {
    const system = this.systems[key];
    if (!system || !this.detail) return;

    this.detail.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = system.name;
    Object.assign(heading.style, this.styles.title);

    const description = document.createElement("p");
    description.textContent = system.body;
    const worlds = document.createElement("p");
    worlds.textContent = system.worlds;
    const status = document.createElement("p");
    status.textContent = system.status;
    this.detail.append(heading, description, worlds, status);

    if (this.allowSystemJump) {
      const jump = document.createElement("button");
      jump.type = "button";
      jump.textContent = "JUMP TO SYSTEM";
      Object.assign(jump.style, this.styles.button);
      jump.addEventListener("click", () => this.onJumpSystem(key));
      this.detail.append(jump);
    }
  }

  setLocation(location) {
    const labels = {
      space: "SOLAR SYSTEM",
      earth: "EARTH • BELLWOOD",
      moon: "THE MOON",
      augstaka: "AUGSTAKA",
      anodyne: "ANODYNE",
      galvan: "GALVAN PRIME",
      incursia: "INCURSIA"
    };
    this.currentLocation = labels[location] ? location : "earth";
    if (this.locationMarker) {
      this.locationMarker.textContent = "CURRENT LOCATION · " + labels[this.currentLocation];
    }
  }
}
