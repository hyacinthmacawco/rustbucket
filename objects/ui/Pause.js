export class Pause {
  constructor({ onResume = () => {} } = {}) {
    this.onResume = onResume;
    this.visible = false;
    this.styles = {
      overlay: { position: "fixed", inset: "0", zIndex: "90", display: "none", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0, 5, 2, .76)" },
      panel: { width: "min(92vw, 620px)", maxHeight: "88vh", overflow: "auto", padding: "24px", border: "1px solid rgba(126,255,168,.5)", borderRadius: "10px", background: "rgba(3, 19, 10, .97)", color: "#eaffef", boxShadow: "0 0 42px rgba(61,255,131,.15)" },
      title: { margin: "0 0 20px", color: "#a6ffbd", fontFamily: "Nulshock, sans-serif", letterSpacing: ".14em", fontSize: "1.4rem" },
      tabs: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" },
      tab: { padding: "10px 14px", border: "1px solid rgba(126,255,168,.35)", borderRadius: "4px", background: "rgba(5, 35, 18, .8)", color: "#eaffef", font: "inherit", letterSpacing: ".08em" },
      activeTab: { borderColor: "#8cffaa", background: "rgba(23, 90, 46, .8)" },
      content: { minHeight: "120px", lineHeight: "1.6", color: "#d8ffe2" },
      resume: { width: "100%", marginTop: "20px", padding: "13px", border: "1px solid rgba(126,255,168,.6)", borderRadius: "4px", background: "rgba(16, 82, 39, .9)", color: "#f1fff4", font: "inherit", letterSpacing: ".14em" },
      heading: { color: "#a6ffbd", letterSpacing: ".1em" },
      label: { display: "flex", justifyContent: "space-between", gap: "16px", padding: "10px 0", borderBottom: "1px solid rgba(126,255,168,.16)" },
      input: { accentColor: "#72f89b" }
    };
  }

  create() {
    this.element = document.createElement("div");
    this.element.id = "pause-overlay";
    Object.assign(this.element.style, this.styles.overlay);

    this.panel = document.createElement("section");
    this.panel.id = "pause-panel";
    Object.assign(this.panel.style, this.styles.panel);

    this.title = document.createElement("h2");
    this.title.textContent = "PAUSED";
    Object.assign(this.title.style, this.styles.title);

    this.tabs = document.createElement("nav");
    Object.assign(this.tabs.style, this.styles.tabs);
    this.content = document.createElement("div");
    this.content.id = "pause-content";
    Object.assign(this.content.style, this.styles.content);

    this.tabButtons = new Map();
    for (const [key, label] of [["settings", "SETTINGS"], ["help", "HELP"], ["credits", "CREDITS"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      Object.assign(button.style, this.styles.tab);
      button.addEventListener("click", () => this.showTab(key));
      this.tabs.append(button);
      this.tabButtons.set(key, button);
    }

    this.resumeButton = document.createElement("button");
    this.resumeButton.type = "button";
    this.resumeButton.textContent = "RESUME";
    Object.assign(this.resumeButton.style, this.styles.resume);
    this.resumeButton.addEventListener("click", this.onResume);

    this.panel.append(this.title, this.tabs, this.content, this.resumeButton);
    this.element.append(this.panel);
    document.body.append(this.element);
    this.showTab("settings");
    return this.element;
  }

  showTab(name) {
    for (const [key, button] of this.tabButtons) {
      Object.assign(button.style, this.styles.tab, key === name ? this.styles.activeTab : {});
    }

    this.content.replaceChildren();
    if (name === "settings") {
      const heading = document.createElement("h3");
      heading.textContent = "SETTINGS";
      Object.assign(heading.style, this.styles.heading);
      this.content.append(heading);

      for (const [labelText, min, max, value] of [["CAMERA SENSITIVITY", 1, 15, 6], ["MASTER VOLUME", 0, 100, 70]]) {
        const label = document.createElement("label");
        label.textContent = labelText;
        Object.assign(label.style, this.styles.label);
        const input = document.createElement("input");
        input.type = "range";
        input.min = String(min);
        input.max = String(max);
        input.value = String(value);
        Object.assign(input.style, this.styles.input);
        label.append(input);
        this.content.append(label);
      }
    } else if (name === "help") {
      const heading = document.createElement("h3");
      heading.textContent = "CONTROLS";
      Object.assign(heading.style, this.styles.heading);
      const text = document.createElement("p");
      text.textContent = "WASD / joystick: move. Drag: camera. Pinch / wheel: zoom. F / double-tap joystick: switch team member. Space / jump: system map when Rustbucket is selected. E / pick: interact. Q / attack: use weapon. R: open or close Rustbucket ramp.";
      this.content.append(heading, text);
    } else {
      const heading = document.createElement("h3");
      heading.textContent = "CREDITS";
      Object.assign(heading.style, this.styles.heading);
      const developer = document.createElement("p");
      developer.textContent = "Developed by Hyacinth Macaw.";
      const soundtrack = document.createElement("p");
      soundtrack.textContent = "Soundtrack artists: see soundtrack credits.";
      const franchise = document.createElement("p");
      franchise.textContent = "Ben 10 created by Man of Action.";
      this.content.append(heading, developer, soundtrack, franchise);
    }
  }

  setVisible(visible) {
    this.visible = Boolean(visible);
    this.element.style.display = this.visible ? "flex" : "none";
  }

  destroy() {
    this.resumeButton?.removeEventListener("click", this.onResume);
    this.element?.remove();
  }
}
