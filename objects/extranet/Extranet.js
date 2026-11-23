export class Extranet {
  constructor({ onContinue = () => {}, onComplete = () => {}, simulation = null, onData = () => {}, onJumpSystem = () => {} } = {}) {
  this.simulation = simulation;
  this.onJumpSystem = onJumpSystem;
  const root = this.root = document.createElement("section");
  this.root.id = "extranet-overlay";
  this.root.innerHTML = `
    <div id="extranet-window">
      <nav id="extranet-toolbar"><button id="extranet-back" aria-label="Back">BACK</button><input id="extranet-address" aria-label="Web address" value="extranet://home"><button id="extranet-home" aria-label="Home">HOME</button><button id="extranet-close" aria-label="Close">CLOSE</button></nav>
      <main id="extranet-page"></main>
    </div>`;
  document.body.appendChild(root);
  this.styles = {
    root: { position: "fixed", inset: "0", display: "none", alignItems: "center", justifyContent: "center", padding: "max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))", background: "rgba(0, 8, 4, .72)", zIndex: "100" },
    window: { width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(126,255,168,.42)", borderRadius: "12px", background: "rgba(3, 18, 10, .94)", boxShadow: "0 0 45px rgba(56,255,128,.14)" },
    toolbar: { display: "flex", alignItems: "center", gap: "8px", padding: "10px", borderBottom: "1px solid rgba(126,255,168,.22)", background: "rgba(7,32,17,.94)" },
    button: { padding: "9px 12px", border: "1px solid rgba(126,255,168,.38)", borderRadius: "5px", background: "rgba(7,42,22,.8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em" },
    address: { flex: "1", minWidth: "0", padding: "9px 12px", border: "1px solid rgba(126,255,168,.25)", borderRadius: "5px", background: "rgba(0,10,5,.7)", color: "#baffcb", font: "inherit" },
    page: { flex: "1", minHeight: "0", overflow: "auto", color: "#eaffef", fontFamily: "Industry, sans-serif" }
  };
  Object.assign(this.root.style, this.styles.root);
  Object.assign(this.root.querySelector("#extranet-window").style, this.styles.window);
  Object.assign(this.root.querySelector("#extranet-toolbar").style, this.styles.toolbar);
  this.root.querySelectorAll("#extranet-toolbar button").forEach(button => Object.assign(button.style, this.styles.button));

  const page = this.page = this.root.querySelector("#extranet-page");
  const address = this.address = this.root.querySelector("#extranet-address");
  Object.assign(this.address.style, this.styles.address);
  Object.assign(this.page.style, this.styles.page);
  this.relationshipNames = ["Ben","Gwen","Kevin","Rook","Highbreed","Incursean","Anodite","Galvan","Human"];
  this.photos = [];
  this.current = "home";
  this.completed = false;
  this.storedCount = 0;
  this.completionPresented = false;
  this.completionValues = [];
  this.currentLocation = "earth";

  this.home = () => {
    this.current = "home"; this.address.value = "extranet://home";
    this.page.innerHTML = `<div class="extranet-bookmarks"><button data-url="private"><span><b>Private Cloud</b></span></button><button data-url="omnidata"><span><b>Omnidata</b></span></button></div>`;
    this.page.querySelectorAll("[data-url]").forEach(b => b.addEventListener("click", () => b.dataset.url === "private" ? this.privateCloud() : this.omnidata()));
  }
  this.privateCloud = () => {
    this.current = "private"; this.address.value = "ottps://bgkr.omnicloud.com";
    this.page.innerHTML = '<div class="cloud-links">' +
      '<button data-page="tasks"><span><b>Tasks</b></span></button>' +
      '<button data-page="relationships"><span><b>Relationships</b></span></button>' +
      '<button data-page="memories"><span><b>Memories</b></span></button>' +
      '<button data-page="accounts"><span><b>Accounts</b></span></button>' +
      '<button data-page="inventory"><span><b>Inventory</b></span></button>' +
      '<button data-page="event-log"><span><b>Event Log</b></span></button></div>';
    this.page.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", () => {
      const target = button.dataset.page;
      const views = { accounts: "accounting", inventory: "items", "event-log": "events" };
      if (views[target]) {
        this.current = target;
        this.address.value = "ottps://bgkr.omnicloud.com/" + target;
        onData(page, views[target]);
      } else ({ tasks, relationships: showRelationships, memories })[target]();
    }));
  }

  this.tasks = () => {
    this.current = "tasks"; this.address.value = "ottps://bgkr.omnicloud.com/tasks";
    const count = this.storedCount;
    this.page.innerHTML = `<article class="task-card"><h2>Put suitcases into Rustbucket</h2><div class="task-progress"><span style="width:${count*25}%"></span></div><b>${count}/4 SUITCASES STORED</b></article>`;
    if (this.completed) this.showCompletion();
  }
  this.showRelationships = () => {
    this.current = "relationships";
    this.address.value = "ottps://bgkr.omnicloud.com/relationships";
    const header = "<thead><tr><th>FROM / TO</th>" + this.relationshipNames.map(name => "<th>" + name + "</th>").join("") + "</tr></thead>";
    const body = this.relationshipNames.map(from => {
      const cells = this.relationshipNames.map(to => {
        const value = from === to ? 0 : (simulation?.getRelationship(from, to) ?? 0);
        const fillLeft = value >= 0 ? 50 : 50 + value / 2;
        const fillWidth = Math.abs(value) / 2;
        const fillColor = value < 0 ? "#ff8178" : "#80ffa6";
        return "<td class=\"" + (from === to ? "self" : "") + "\"><span>" + Number(value).toFixed(0) + "%</span><i><b style=\"left:" + fillLeft + "%;width:" + fillWidth + "%;background:" + fillColor + "\"></b></i></td>";
      }).join("");
      return "<tr><th>" + from + "</th>" + cells + "</tr>";
    }).join("");
    this.page.innerHTML = "<div class=\"relationship-matrix-wrap\"><table class=\"relationship-matrix\">" + header + "<tbody>" + body + "</tbody></table></div>";
  }

  this.memories = () => {
    this.current = "memories"; this.address.value = "ottps://bgkr.omnicloud.com/memories";
    this.page.innerHTML = `<button id="capture-memory" class="cloud-action">CAPTURE SCREEN</button><div id="memory-grid">${this.photos.map((src,i)=>`<figure><img src="${src}" alt="Captured memory ${i+1}"></figure>`).join("")}</div>`;
    this.page.querySelector("#capture-memory").addEventListener("click", capturePhoto);
  }
  this.omnidata = (allowSystemJump = false) => {
    this.current = "omnidata"; this.address.value = "ottps://en.omnidata.org";
    const systems = {
      solar: {name:"SOLAR SYSTEM", body:"Earth, the Moon, Mars and other known worlds orbit the Sun. Earth is the team's homeworld.", worlds:"Earth • Moon • Mars • Saturn • Pluto", status:"ACTIVE / HOME SYSTEM", source:"https://ben10.fandom.com/wiki/Solar_System"},
      highbreed: {name:"HIGHBREED HOMEWORLD", body:"Augstaka is the Highbreed homeworld. It is described as a temperate world with rolling green hills, coastal waters and large cities. At least one moon is known; the wiki does not give this system a canonical name.", worlds:"Augstaka • at least one moon", status:"ACTIVE / AUGSTAKA", source:"https://ben10.fandom.com/wiki/Augstaka"},
      incursean: {name:"INCURSEAN HOMEWORLD", body:"Incursia was the Incursean homeworld. It was destroyed after an attempt to use Ascalon to end a civil war. The wiki does not give this system a canonical name.", worlds:"Incursia (destroyed)", status:"DESTROYED / HISTORICAL", source:"https://ben10.fandom.com/wiki/Incursia"},
      anodite: {name:"ANODITE HOMEWORLD", body:"Anodyne is the home planet of the Anodites. From space it appears dark red, with orange rings; the wiki does not give this system a canonical name.", worlds:"Anodyne", status:"ACTIVE / ANODYNE", source:"https://ben10.fandom.com/wiki/Anodyne"},
      galvan: {name:"GALVAN STAR SYSTEM", body:"Galvan is the system's star. Galvan Prime is the Galvan homeworld; Galvan B is its moon and home of the Galvanic Mechamorphs.", worlds:"Galvan • Galvan Prime • Galvan B", status:"ACTIVE / GALVAN PRIME", source:"https://ben10.fandom.com/wiki/Galvan_Star_System_(Classic)"}
    };
    this.page.innerHTML = `<div id="omnidata-layout">
        <div id="omnidata-map-wrap">
          <svg id="omnidata-map" viewBox="0 0 900 520" role="img" aria-label="Omnidata directory of five separate Ben 10 star systems">
            <defs><radialGradient id="omni-nebula"><stop stop-color="#174d35" stop-opacity=".42"/><stop offset="1" stop-color="#07140f" stop-opacity="0"/></radialGradient></defs>
            <rect width="900" height="520" rx="14" fill="#06140e"/>
            <ellipse cx="455" cy="255" rx="420" ry="245" fill="url(#omni-nebula)"/>
                    <g class="omni-stars"><circle cx="65" cy="65" r="1.5"/><circle cx="250" cy="70" r="2"/><circle cx="430" cy="65" r="1.4"/><circle cx="700" cy="70" r="1.6"/><circle cx="840" cy="150" r="1.5"/><circle cx="90" cy="250" r="1.4"/><circle cx="430" cy="300" r="1.4"/><circle cx="830" cy="440" r="2"/><circle cx="300" cy="450" r="1.5"/></g>
            <g class="omni-node" data-system="solar" tabindex="0" role="button" aria-label="Solar System"><circle class="omni-halo" cx="130" cy="370" r="30"/><circle class="omni-core solar" cx="130" cy="370" r="10"/><text x="130" y="414" text-anchor="middle">SOLAR</text></g>
            <g class="omni-node" data-system="highbreed" tabindex="0" role="button" aria-label="Highbreed System"><circle class="omni-halo" cx="335" cy="155" r="30"/><circle class="omni-core highbreed" cx="335" cy="155" r="10"/><text x="335" y="199" text-anchor="middle">HIGHBREED</text></g>
            <g class="omni-node" data-system="incursean" tabindex="0" role="button" aria-label="Incursean System"><circle class="omni-halo" cx="560" cy="105" r="30"/><circle class="omni-core incursean" cx="560" cy="105" r="10"/><text x="560" y="149" text-anchor="middle">INCURSEAN</text></g>
            <g class="omni-node" data-system="galvan" tabindex="0" role="button" aria-label="Galvan Star System"><circle class="omni-halo" cx="770" cy="280" r="30"/><circle class="omni-core galvan" cx="770" cy="280" r="10"/><text x="770" y="324" text-anchor="middle">GALVAN</text></g>
            <g class="omni-node" data-system="anodite" tabindex="0" role="button" aria-label="Anodite System"><circle class="omni-halo" cx="565" cy="425" r="30"/><circle class="omni-core anodite" cx="565" cy="425" r="10"/><text x="565" y="469" text-anchor="middle">ANODITE</text></g>
          </svg>
          <div id="omnidata-this.current-location"></div>
        </div>
        <aside id="omnidata-detail"></aside>
      </div>`;
    this.detail = this.page.querySelector("#omnidata-detail");
    this.systems = systems;
    this.allowSystemJump = allowSystemJump;
    this.page.querySelectorAll(".omni-node").forEach(node => {
      node.addEventListener("click", () => this.selectSystem(node.dataset.system));
      node.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.selectSystem(node.dataset.system);
        }
      });
    });

  selectSystem(key) {
    const item = this.systems[key];
    if (!item) return;

    this.page.querySelectorAll(".omni-node").forEach(node => {
      node.classList.toggle("selected", node.dataset.system === key);
    });

    this.detail.innerHTML =
      "<h2>" + item.name + "</h2>" +
      "<p>" + item.body + "</p>" +
      "<div class=\"omni-worlds\">" + item.worlds + "</div>" +
      "<p class=\"omni-status\">" + item.status + "</p>" +
      (this.allowSystemJump ? '<button id="omnidata-jump" type="button">JUMP TO SYSTEM</button>' : "");

    if (this.allowSystemJump) {
      this.detail.querySelector("#omnidata-jump").addEventListener("click", () => {
        this.onJumpSystem(key);
      });
    }
  }

