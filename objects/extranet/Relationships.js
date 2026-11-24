import { Ben } from "../team/Ben.js";
import { Gwen } from "../team/Gwen.js";
import { Kevin } from "../team/Kevin.js";
import { Rook } from "../team/Rook.js";
import { Highbreed } from "../species/Highbreed.js";
import { Incursean } from "../species/Incursean.js";
import { Anodite } from "../species/Anodite.js";
import { Galvan } from "../species/Galvan.js";
import { Human } from "../species/Human.js";
import { Earth } from "../celestials/Earth.js";
import { Augstaka } from "../celestials/Augstaka.js";
import { Incursia } from "../celestials/Incursia.js";
import { Anodyne } from "../celestials/Anodyne.js";
import { GalvanPrime } from "../celestials/GalvanPrime.js";

export class Relationships {
  constructor() {
    this.names = ["Ben", "Gwen", "Kevin", "Rook", "Highbreed", "Incursean", "Anodite", "Galvan", "Human"];
    this.homeworlds = {
      Highbreed: "augstaka",
      Incursean: "incursia",
      Anodite: "anodyne",
      Galvan: "galvan",
      Human: "earth"
    };
    this.entityClasses = { Ben, Gwen, Kevin, Rook, Highbreed, Incursean, Anodite, Galvan, Human };
    this.planetClasses = { earth: Earth, augstaka: Augstaka, incursia: Incursia, anodyne: Anodyne, galvan: GalvanPrime };
    this.styles = {
      wrapper: { overflowX: "auto" },
      table: { width: "100%", borderCollapse: "collapse", minWidth: "760px", fontSize: ".78rem" },
      cell: { padding: "8px", border: "1px solid rgba(126,255,168,.14)", textAlign: "center", color: "#dfffe8" },
      track: { position: "relative", display: "block", height: "5px", minWidth: "44px", marginTop: "4px", borderRadius: "5px", background: "rgba(255,255,255,.1)" },
      fill: { position: "absolute", top: "0", height: "100%", borderRadius: "5px" }
    };
  }

  getRelationship(from, to) {
    if (from === to) return 0;
    const homeworld = this.homeworlds[from];
    if (homeworld) {
      try {
        const saved = JSON.parse(localStorage.getItem("rustbucket.planet." + homeworld) || "null");
        const value = saved?.relationships?.[to];
        if (value !== undefined) return Number(value);
      } catch (error) {
        // Use the in-memory planet relationship when storage is unavailable.
      }
    }
    const PlanetClass = this.planetClasses[homeworld];
    return Number(PlanetClass?.relationships?.[to] ?? this.entityClasses[from]?.relationships?.[to] ?? 0);
  }

  addRelationship(from, to, amount = 0.1) {
    if (from === to || (!this.entityClasses[from] && !this.homeworlds[from])) return;
    const homeworld = this.homeworlds[from];
    const source = homeworld ? this.planetClasses[homeworld] : this.entityClasses[from];
    if (!source) return;
    source.relationships ||= {};
    const relationships = source.relationships;
    relationships[to] = Math.max(-100, Math.min(100, this.getRelationship(from, to) + amount));
    if (homeworld) {
      try {
        const key = "rustbucket.planet." + homeworld;
        const saved = JSON.parse(localStorage.getItem(key) || "null") || {};
        saved.relationships = { ...(saved.relationships || {}), [to]: relationships[to] };
        localStorage.setItem(key, JSON.stringify(saved));
      } catch (error) {
        // Keep the in-memory planet relationship when storage is unavailable.
      }
    }
    return relationships[to];
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
        const value = this.getRelationship(from, to);
        const number = document.createElement("span");
        number.textContent = value.toFixed(0) + "%";
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
