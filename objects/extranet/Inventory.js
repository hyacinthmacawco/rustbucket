export class Inventory {
  constructor(simulation) {
    this.simulation = simulation;
    this.data = simulation.data;
    this.styles = {
      page: { color: "#eaffef", fontFamily: "Industry, sans-serif" },
      title: { margin: "0 0 20px", color: "#9effb6", fontFamily: "Nulshock, sans-serif", letterSpacing: ".12em", fontSize: "1.2rem" },
      heading: { color: "#d8ffe2", letterSpacing: ".1em", fontSize: "1rem" },
      row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "12px", borderBottom: "1px solid rgba(126,255,168,.16)" },
      button: { padding: "8px 12px", border: "1px solid rgba(126,255,168,.45)", background: "rgba(7,42,22,.8)", color: "#eaffef", font: "inherit" },
      select: { margin: "12px", padding: "8px", background: "rgba(0,10,5,.8)", color: "#eaffef", border: "1px solid rgba(126,255,168,.35)" }
    };
  }

  render(host) {
    host.replaceChildren();
    const section = document.createElement("section");
    Object.assign(section.style, this.styles.page);
    const title = document.createElement("h2");
    title.textContent = "INVENTORY";
    Object.assign(title.style, this.styles.title);
    const shipHeading = document.createElement("h3");
    shipHeading.textContent = "RUSTBUCKET INVENTORY";
    Object.assign(shipHeading.style, this.styles.heading);
    this.shipInventory = document.createElement("div");

    const carrierHeading = document.createElement("h3");
    carrierHeading.textContent = "CHARACTER CARRIED ITEMS";
    Object.assign(carrierHeading.style, this.styles.heading);
    const label = document.createElement("label");
    label.textContent = "CHARACTER ";
    this.carrier = document.createElement("select");
    Object.assign(this.carrier.style, this.styles.select);
    for (const name of ["Ben", "Gwen", "Kevin", "Rook"]) {
      const option = document.createElement("option");
      option.textContent = name;
      this.carrier.append(option);
    }
    label.append(this.carrier);
    this.carriedInventory = document.createElement("div");
    section.append(title, shipHeading, this.shipInventory, carrierHeading, label, this.carriedInventory);
    host.append(section);
    this.carrier.addEventListener("change", this.renderItems);
    this.renderItems();
  }

  renderItems = () => {
    this.shipInventory.replaceChildren();
    this.carriedInventory.replaceChildren();

    for (const item of this.data.team.inventory) {
      const row = document.createElement("div");
      Object.assign(row.style, this.styles.row);
      const label = document.createElement("span");
      label.textContent = item.name + " ×" + item.quantity + " · " + item.category;
      const button = document.createElement("button");
      button.textContent = "CARRY";
      Object.assign(button.style, this.styles.button);
      button.addEventListener("click", () => {
        this.simulation.moveItemToCharacter(item.id, this.carrier.value);
        this.renderItems();
      });
      row.append(label, button);
      this.shipInventory.append(row);
    }

    const carried = this.data.team.carried[this.carrier.value] || [];
    for (const [index, item] of carried.entries()) {
      const row = document.createElement("div");
      Object.assign(row.style, this.styles.row);
      const name = document.createElement("span");
      name.textContent = item;
      const button = document.createElement("button");
      button.textContent = "STORE";
      Object.assign(button.style, this.styles.button);
      button.addEventListener("click", () => {
        this.simulation.moveItemToShip(this.carrier.value, index);
        this.renderItems();
      });
      row.append(name, button);
      this.carriedInventory.append(row);
    }
  };
}
