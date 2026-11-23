import { Tasks } from "./Tasks.js";
import { Relationships } from "./Relationships.js";
import { Memories } from "./Memories.js";

export class Extranet {
  constructor({
    onContinue = () => {},
    onComplete = () => {},
    onJumpSystem = () => {}
  } = {}) {
    this.onContinue = onContinue;
    this.onComplete = onComplete;
    this.onJumpSystem = onJumpSystem;

    this.current = "home";
    this.currentLocation = "earth";
    this.completionPresented = false;
    this.pages = {
      tasks: new Tasks({ onComplete: this.onComplete }),
      relationships: new Relationships(),
      memories: new Memories()
    };

    this.systems = {
      solar: {
        name: "SOLAR SYSTEM",
        body: "Earth, the Moon, Mars and other known worlds orbit the Sun. Earth is the team's homeworld.",
        worlds: "Earth • Moon • Mars • Saturn • Pluto",
        status: "ACTIVE / HOME SYSTEM"
      },
      highbreed: {
        name: "HIGHBREED HOMEWORLD",
        body: "Augstaka is the Highbreed homeworld, known for its temperate climate, rolling green hills and coastal waters.",
        worlds: "Augstaka • at least one moon",
        status: "ACTIVE / AUGSTAKA"
      },
      incursean: {
        name: "INCURSEAN HOMEWORLD",
        body: "Incursia was the Incursean homeworld. It was destroyed after an attempt to use Ascalon to end a civil war.",
        worlds: "Incursia (destroyed)",
        status: "DESTROYED / HISTORICAL"
      },
      anodite: {
        name: "ANODITE HOMEWORLD",
        body: "Anodyne is the home planet of the Anodites. From space it appears dark red, with orange rings.",
        worlds: "Anodyne",
        status: "ACTIVE / ANODYNE"
      },
      galvan: {
        name: "GALVAN STAR SYSTEM",
        body: "Galvan is the system's star. Galvan Prime is the Galvan homeworld; Galvan B is its moon and home of the Galvanic Mechamorphs.",
        worlds: "Galvan • Galvan Prime • Galvan B",
        status: "ACTIVE / GALVAN PRIME"
      }
    };

    this.styles = {
      root: {
        position: "fixed",
        inset: "0",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        padding: "max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))",
        background: "rgba(0, 8, 4, .72)",
        zIndex: "100"
      },
      window: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(126,255,168,.42)",
        borderRadius: "12px",
        background: "rgba(3, 18, 10, .96)",
        boxShadow: "0 0 45px rgba(56,255,128,.14)"
      },
      toolbar: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px",
        borderBottom: "1px solid rgba(126,255,168,.22)",
        background: "rgba(7,32,17,.94)"
      },
      button: {
        padding: "9px 12px",
        border: "1px solid rgba(126,255,168,.38)",
        borderRadius: "5px",
        background: "rgba(7,42,22,.8)",
        color: "#eaffef",
        font: "inherit",
        letterSpacing: ".08em",
        cursor: "pointer"
      },
      address: {
        flex: "1",
        minWidth: "0",
        padding: "9px 12px",
        border: "1px solid rgba(126,255,168,.25)",
        borderRadius: "5px",
        background: "rgba(0,10,5,.7)",
        color: "#baffcb",
        font: "inherit"
      },
      page: {
        flex: "1",
        minHeight: "0",
        overflow: "auto",
        padding: "clamp(14px, 3vw, 28px)",
        color: "#eaffef",
        fontFamily: "Industry, sans-serif"
      },
      pageTitle: {
        margin: "0 0 20px",
        color: "#9effb6",
        fontFamily: "Nulshock, sans-serif",
        letterSpacing: ".12em",
        fontSize: "1.25rem"
      },
      card: {
        padding: "18px",
        border: "1px solid rgba(126,255,168,.28)",
        borderRadius: "8px",
        background: "rgba(5,30,16,.72)"
      },
      bookmarkGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "14px"
      },
      bookmark: {
        minHeight: "120px",
        padding: "18px",
        border: "1px solid rgba(126,255,168,.35)",
        borderRadius: "8px",
        background: "rgba(5,35,18,.78)",
        color: "#eaffef",
        font: "inherit",
        fontSize: "1.1rem",
        letterSpacing: ".1em",
        textAlign: "left"
      },
      progress: {
        width: "100%",
        height: "8px",
        margin: "14px 0",
        overflow: "hidden",
        borderRadius: "8px",
        background: "rgba(126,255,168,.14)"
      },
      progressFill: {
        height: "100%",
        background: "#75f59a",
        transition: "width .2s ease"
      },
      table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "760px",
        fontSize: ".78rem"
      },
      cell: {
        padding: "8px",
        border: "1px solid rgba(126,255,168,.14)",
        textAlign: "center",
        color: "#dfffe8"
      },
      relationshipTrack: {
        position: "relative",
        display: "block",
        height: "5px",
        minWidth: "44px",
        marginTop: "4px",
        borderRadius: "5px",
        background: "rgba(255,255,255,.1)"
      },
      relationshipFill: {
        position: "absolute",
        top: "0",
        height: "100%",
        borderRadius: "5px"
      },
      launchButton: {
        position: "fixed",
        top: "max(14px, env(safe-area-inset-top))",
        right: "max(70px, calc(env(safe-area-inset-right) + 70px))",
        zIndex: "30",
        padding: "10px 14px",
        border: "1px solid rgba(126,255,168,.5)",
        borderRadius: "20px",
        background: "rgba(5,30,18,.84)",
        color: "#eaffef",
        font: "inherit",
        letterSpacing: ".08em"
      },
      completion: {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "120",
        padding: "18px 28px",
        border: "1px solid rgba(126,255,168,.55)",
        borderRadius: "8px",
        background: "rgba(3,20,10,.92)",
        color: "#caffd5",
        fontFamily: "Nulshock, sans-serif",
        letterSpacing: ".12em"
      }
    };

    this.root = document.createElement("section");
    this.root.id = "extranet-overlay";
    this.window = document.createElement("div");
    this.window.id = "extranet-window";
    Object.assign(this.window.style, this.styles.window);

    this.toolbar = document.createElement("nav");
    this.toolbar.id = "extranet-toolbar";
    Object.assign(this.toolbar.style, this.styles.toolbar);

    this.backButton = this.createToolbarButton("BACK", "Back");
    this.address = document.createElement("input");
    this.address.type = "text";
    this.address.value = "extranet://home";
    this.address.setAttribute("aria-label", "Web address");
    Object.assign(this.address.style, this.styles.address);
    this.homeButton = this.createToolbarButton("HOME", "Home");
    this.closeButton = this.createToolbarButton("CLOSE", "Close");

    this.toolbar.append(this.backButton, this.address, this.homeButton, this.closeButton);
    this.page = document.createElement("main");
    this.page.id = "extranet-page";
    Object.assign(this.page.style, this.styles.page);
    this.window.append(this.toolbar, this.page);
    this.root.append(this.window);
    Object.assign(this.root.style, this.styles.root);
    document.body.append(this.root);

    this.backButton.addEventListener("click", this.goBack);
    this.homeButton.addEventListener("click", this.home);
    this.closeButton.addEventListener("click", this.close);
    this.address.addEventListener("keydown", this.handleAddressKey);
    this.home();
  }

  createToolbarButton(label, ariaLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    Object.assign(button.style, this.styles.button);
    return button;
  }

  createButton() {
    this.launchButton = document.createElement("button");
    this.launchButton.type = "button";
    this.launchButton.id = "extranet-button";
    this.launchButton.setAttribute("aria-label", "Open Extranet");
    this.launchButton.textContent = "EXTRANET";
    Object.assign(this.launchButton.style, this.styles.launchButton);
    this.launchButton.addEventListener("click", this.open);
    document.body.append(this.launchButton);
    return this.launchButton;
  }

  goBack = () => {
    if (this.current === "home") this.close();
    else if (this.current === "private" || this.current === "omnidata") this.home();
    else this.privateCloud();
  };

  handleAddressKey = event => {
    if (event.key !== "Enter") return;
    const url = this.address.value.trim().toLowerCase();

    if (url.includes("bgkr.omnicloud.com")) {
      if (url.endsWith("/tasks")) this.tasks();
      else if (url.endsWith("/relationships")) this.showRelationships();
      else if (url.endsWith("/memories")) this.memories();
      else this.privateCloud();
    } else if (url.includes("en.omnidata.org")) {
      this.omnidata();
    } else if (url === "extranet://home") {
      this.home();
    }
  };

  home = () => {
    this.current = "home";
    this.address.value = "extranet://home";
    this.page.replaceChildren();

    const grid = document.createElement("div");
    Object.assign(grid.style, this.styles.bookmarkGrid);

    for (const [label, target] of [["Private Cloud", "private"], ["Omnidata", "omnidata"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      Object.assign(button.style, this.styles.bookmark);
      button.addEventListener("click", () => {
        if (target === "private") this.privateCloud();
        else this.omnidata();
      });
      grid.append(button);
    }

    this.page.append(grid);
  };

  privateCloud = () => {
    this.current = "private";
    this.address.value = "ottps://bgkr.omnicloud.com";
    this.page.replaceChildren();

    const grid = document.createElement("div");
    Object.assign(grid.style, this.styles.bookmarkGrid);

    for (const [label, target] of [
      ["Tasks", "tasks"],
      ["Relationships", "relationships"],
      ["Memories", "memories"]
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      Object.assign(button.style, this.styles.bookmark);
      button.addEventListener("click", () => {
        if (target === "tasks") this.tasks();
        else if (target === "relationships") this.showRelationships();
        else if (target === "memories") this.memories();
      });
      grid.append(button);
    }

    this.page.append(grid);
  };

  tasks() {
    this.current = "tasks";
    this.address.value = "ottps://bgkr.omnicloud.com/tasks";
    this.pages.tasks.render(this.page);
    if (this.completed) this.showCompletion();
  }



  showRelationships() {
    this.current = "relationships";
    this.address.value = "ottps://bgkr.omnicloud.com/relationships";
    this.pages.relationships.render(this.page);
  }

  memories() {
    this.current = "memories";
    this.address.value = "ottps://bgkr.omnicloud.com/memories";
    this.pages.memories.render(this.page);
  }



;

  omnidata(allowSystemJump = false) {
    this.current = "omnidata";
    this.address.value = "ottps://en.omnidata.org";
    this.page.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = "OMNIDATA";
    Object.assign(title.style, this.styles.pageTitle);

    const grid = document.createElement("div");
    Object.assign(grid.style, this.styles.bookmarkGrid);

    const detail = document.createElement("article");
    Object.assign(detail.style, this.styles.card);
    this.detail = detail;
    this.allowSystemJump = allowSystemJump;

    for (const [key, item] of Object.entries(this.systems)) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.name;
      Object.assign(button.style, this.styles.bookmark);
      button.addEventListener("click", () => this.selectSystem(key));
      grid.append(button);
    }

    this.locationMarker = document.createElement("p");
    this.locationMarker.textContent = "CURRENT LOCATION";
    this.page.append(title, grid, this.locationMarker, detail);
    this.selectSystem("solar");
    this.setLocation(this.currentLocation);
  }

  selectSystem(key) {
    const item = this.systems[key];
    if (!item || !this.detail) return;

    this.detail.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = item.name;
    Object.assign(heading.style, this.styles.pageTitle);
    const description = document.createElement("p");
    description.textContent = item.body;
    const worlds = document.createElement("p");
    worlds.textContent = item.worlds;
    const status = document.createElement("p");
    status.textContent = item.status;
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

  addRelationship(picker, owner) {
    this.pages.relationships.addRelationship(
      String(picker).replace(/^./, character => character.toUpperCase()),
      String(owner).replace(/^./, character => character.toUpperCase())
    );
  }

  updateTask(count = this.pages.tasks.storedCount + 1) {
    this.pages.tasks.update(count);
    if (this.completed) this.showCompletion();
  }

  showCompletion() {
    if (this.completionPresented || document.getElementById("mission-complete")) return;
    this.completionPresented = true;

    this.completionNotice = document.createElement("div");
    this.completionNotice.id = "mission-complete";
    this.completionNotice.textContent = "TASK COMPLETED";
    Object.assign(this.completionNotice.style, this.styles.completion);
    document.body.append(this.completionNotice);
    window.setTimeout(() => this.completionNotice?.remove(), 5200);
  }

  open = () => {
    this.root.style.display = "flex";
    this.home();
  };

  openOmnidata = () => {
    this.root.style.display = "flex";
    this.omnidata(true);
  };

  close = () => {
    this.root.style.display = "none";
    this.onContinue();
  };

  get completed() {
    return this.pages.tasks.completed;
  }

  destroy() {
    this.pages.tasks.destroy?.();
    this.pages.relationships.destroy?.();
    this.pages.memories.destroy();
    this.backButton.removeEventListener("click", this.goBack);
    this.homeButton.removeEventListener("click", this.home);
    this.closeButton.removeEventListener("click", this.close);
    this.address.removeEventListener("keydown", this.handleAddressKey);
    this.launchButton?.removeEventListener("click", this.open);
    this.launchButton?.remove();
    this.completionNotice?.remove();
    this.root.remove();
  }
}
