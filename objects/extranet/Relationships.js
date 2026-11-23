export class Relationships {
  constructor(simulation) {
    this.simulation = simulation;
    this.names = ["Ben", "Gwen", "Kevin", "Rook", "Highbreed", "Incursean", "Anodite", "Galvan", "Human"];
    this.styles = {
      wrapper: { overflowX: "auto" },
      table: { width: "100%", borderCollapse: "collapse", minWidth: "760px", fontSize: ".78rem" },
      cell: { padding: "8px", border: "1px solid rgba(126,255,168,.14)", textAlign: "center", color: "#dfffe8" },
      track: { position: "relative", display: "block", height: "5px", minWidth: "44px", marginTop: "4px", borderRadius: "5px", background: "rgba(255,255,255,.1)" },
      fill: { position: "absolute", top: "0", height: "100%", borderRadius: "5px" }
    };
  }

  render(host) {
    host.replaceChildren();
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, this.styles.wrapper);
    const table = document.createElement("table");
    Object.assign(table.style, this.styles.table);
    const header = document.createElement("tr");
    const corner = document.createElement("th");
    corner.textContent = "FROM / TO";
    Object.assign(corner.style, this.styles.cell);
    header.append(corner);

    for (const name of this.names) {
      const cell = document.createElement("th");
      cell.textContent = name;
      Object.assign(cell.style, this.styles.cell);
      header.append(cell);
    }
    table.append(header);

    for (const from of this.names) {
      const row = document.createElement("tr");
      const label = document.createElement("th");
      label.textContent = from;
      Object.assign(label.style, this.styles.cell);
      row.append(label);

      for (const to of this.names) {
        const cell = document.createElement("td");
        Object.assign(cell.style, this.styles.cell);
        const value = from === to ? 0 : (this.simulation?.getRelationship(from, to) ?? 0);
        const number = document.createElement("span");
        number.textContent = Number(value).toFixed(0) + "%";
        cell.append(number);

        if (from !== to) {
          const track = document.createElement("i");
          Object.assign(track.style, this.styles.track);
          const fill = document.createElement("b");
          Object.assign(fill.style, this.styles.fill);
          fill.style.left = (value >= 0 ? 50 : 50 + value / 2) + "%";
          fill.style.width = Math.abs(value) / 2 + "%";
          fill.style.background = value < 0 ? "#ff8178" : "#80ffa6";
          track.append(fill);
          cell.append(track);
        }

        row.append(cell);
      }

      table.append(row);
    }

    wrapper.append(table);
    host.append(wrapper);
  }
}
