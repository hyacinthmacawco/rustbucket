import { PauseTab } from "./PauseTab.js";
import { Resume } from "./Resume.js";
import { VolumeSlider } from "./VolumeSlider.js";
import { CameraSensitivitySlider } from "./CameraSensitivitySlider.js";

export class Pause {
  constructor({ onResume = () => {}, audioPlayer = null, onCameraSensitivity = () => {} } = {}) {
    this.onResume = onResume;
    this.audioPlayer = audioPlayer;
    this.onCameraSensitivity = onCameraSensitivity;
    this.visible = false;
    this.styles = {
      overlay: { position: "fixed", inset: "0", zIndex: "90", display: "none", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0, 5, 2, .76)" },
      panel: { width: "min(92vw, 620px)", maxHeight: "88vh", overflow: "auto", padding: "24px", border: "1px solid rgba(126,255,168,.5)", borderRadius: "10px", background: "rgba(3, 19, 10, .97)", color: "#eaffef", boxShadow: "0 0 42px rgba(61,255,131,.15)" },
      title: { margin: "0 0 20px", color: "#a6ffbd", fontFamily: "Nulshock, sans-serif", letterSpacing: ".14em", fontSize: "1.4rem" },
      tabs: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" },
      content: { minHeight: "120px", lineHeight: "1.6", color: "#d8ffe2" },
      heading: { color: "#a6ffbd", letterSpacing: ".1em" }
    };
    this.tabs = new Map();
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
    this.tabBar = document.createElement("nav");
    Object.assign(this.tabBar.style, this.styles.tabs);
    this.content = document.createElement("div");
    this.content.id = "pause-content";
    Object.assign(this.content.style, this.styles.content);

    for (const [name, label] of [["settings", "SETTINGS"], ["help", "HELP"], ["credits", "CREDITS"]]) {
      const tab = new PauseTab({ name, label, onSelect: key => this.showTab(key), active: name === "settings" });
      this.tabs.set(name, tab);
      this.tabBar.append(tab.create());
    }

    this.resume = new Resume({ onResume: this.onResume });
    this.panel.append(this.title, this.tabBar, this.content, this.resume.create());
    this.element.append(this.panel);
    document.body.append(this.element);
    this.showTab("settings");
    return this.element;
  }

  showTab(name) {
    for (const [key, tab] of this.tabs) tab.setActive(key === name);
    this.volume?.destroy();
    this.sensitivity?.destroy();
    this.content.replaceChildren();

    if (name === "settings") {
      const heading = document.createElement("h3");
      heading.textContent = "SETTINGS";
      Object.assign(heading.style, this.styles.heading);
      this.volume = new VolumeSlider({ audioPlayer: this.audioPlayer });
      this.sensitivity = new CameraSensitivitySlider({ onChange: this.onCameraSensitivity });
      this.content.append(heading, this.sensitivity.create(), this.volume.create());
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
    this.volume?.destroy();
    this.sensitivity?.destroy();
    for (const tab of this.tabs.values()) tab.destroy();
    this.resume?.destroy();
    this.element?.remove();
  }
}