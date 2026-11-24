import { Rustbucket } from "../team/Rustbucket.js";
import { Ben } from "../team/Ben.js";
import { Gwen } from "../team/Gwen.js";
import { Kevin } from "../team/Kevin.js";
import { Rook } from "../team/Rook.js";
import { HumanRig } from "../species/Human.js";
import { BenBag } from "../team/BenBag.js";
import { GwenBag } from "../team/GwenBag.js";
import { KevinBag } from "../team/KevinBag.js";
import { RookBag } from "../team/RookBag.js";
import { Earth } from "../celestials/Earth.js";
import { Joystick } from "../team/Joystick.js";
import { Jump } from "../team/Jump.js";
import { Attack } from "../team/Attack.js";
import { Interact } from "../team/Interact.js";

export class NewGame {
  constructor({ omniverse = null, onSelect = () => {}, onSkip = () => {} } = {}) {
    this.omniverse = omniverse;
    this.onSelect = onSelect;
    this.onSkip = onSkip;
    this.initialized = false;
    this.styles = {
      button: { padding: "14px 24px", background: "rgba(5,22,14,.76)", color: "#eaffef", font: "inherit", letterSpacing: ".16em", cursor: "pointer" },
      prelude: { position: "fixed", inset: "0", display: "none", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "28px", background: "#000", color: "#fff", zIndex: "50", font: "inherit", letterSpacing: ".18em" },
      heading: { fontSize: "clamp(20px, 5vw, 42px)" },
      skip: { padding: "10px 28px", border: "1px solid #79e99a", background: "transparent", color: "#dffff0", font: "inherit", cursor: "pointer" }
    };
  }

  create() {
    this.element = document.createElement("div");
    this.element.type = "div";
    this.element.className = "rb-title-action";
    this.element.textContent = "NEW GAME";
    Object.assign(this.element.style, this.styles.button);
    this.element.addEventListener("click", this.onSelect);

    this.prelude = document.createElement("section");
    this.prelude.id = "prelude-screen";
    Object.assign(this.prelude.style, this.styles.prelude);
    this.heading = document.createElement("div");
    this.heading.textContent = "A NEW DAWN";
    Object.assign(this.heading.style, this.styles.heading);
    this.skip = document.createElement("div");
    this.skip.type = "div";
    this.skip.textContent = "SKIP";
    Object.assign(this.skip.style, this.styles.skip);
    this.skip.addEventListener("click", this.onSkip);
    this.prelude.append(this.heading, this.skip);
    document.body.append(this.prelude);
    return this.element;
  }

  initialize(omniverse = this.omniverse) {
    if (!omniverse || (this.initialized && omniverse.state.currentScene === "earth")) return false;
    this.omniverse = omniverse;
    this.initialized = true;

    omniverse.clearWorld();
    omniverse.earth = new Earth();
    omniverse.earth.enter(omniverse);
    omniverse.crewHomePlanet = omniverse.earth;
    omniverse.vehicleSystem = "solar";

    omniverse.vehicle = new Rustbucket(omniverse.celestial);
    omniverse.vehicle.ship.position.set(0, 2, 34);
    omniverse.vehicle.setRescueContext({
      getCurrentPlanet: () => omniverse.currentPlanet,
      getResidents: () => omniverse.residents || [],
      account: omniverse.account,
      onUpdate: () => omniverse.updateAccountHUD(),
      onPickup: resident => omniverse.handleRescuePickup(resident),
      onDrop: (resident, relationshipIncrease, taydeniteIncrease) => omniverse.handleRescueDrop(resident, relationshipIncrease, taydeniteIncrease)
    });

    omniverse.crew = [
      new Ben({ HumanRig }),
      new Gwen({ HumanRig }),
      new Kevin({ HumanRig }),
      new Rook({ HumanRig })
    ];

    const positions = [
      [-4, 0, 8],
      [-1.4, 0, 8],
      [1.4, 0, 8],
      [4, 0, 8]
    ];

    omniverse.crew.forEach((member, index) => {
      member.group.position.set(...positions[index]);
      omniverse.celestial.add(member.group);
    });

    omniverse.bags = [
      new BenBag(omniverse.celestial, [-7, 0.45, 2]),
      new GwenBag(omniverse.celestial, [-2.5, 0.45, 2]),
      new KevinBag(omniverse.celestial, [2.5, 0.45, 2]),
      new RookBag(omniverse.celestial, [7, 0.45, 2])
    ];

    omniverse.joystick?.destroy();
    this.jumpControl?.destroy();
    this.interactControl?.destroy();
    this.attackControl?.destroy();
    omniverse.joystick = new Joystick();
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    const entities = {
      ben: omniverse.crew[0].group,
      gwen: omniverse.crew[1].group,
      kevin: omniverse.crew[2].group,
      rook: omniverse.crew[3].group,
      rustbucket: omniverse.vehicle.ship
    };
    omniverse.joystick.createKeyboard({
      entities,
      camera: omniverse.camera,
      updateCamera: () => omniverse.updateCamera(),
      isMobile,
      onSelect: selected => {
        omniverse.selectedMember = selected;
        omniverse.selectTeamMember(selected);
      },
      onJump: () => omniverse.helix.openOmnidata(),
      onAtmosphereCheck: () => omniverse.checkAtmosphereTransition(),
      onToggleRamp: () => omniverse.vehicle?.toggleRamp(),
      onTransformationChange: form => omniverse.crew[0]?.setTransformation(form),
      initialSelected: "ben"
    });
    this.jumpControl = new Jump({ onPress: () => { omniverse.joystick.input.jumpRequested = true; } });
    this.interactControl = new Interact({ onPress: () => { omniverse.joystick.input.pickRequested = true; } });
    this.attackControl = new Attack({
      onStart: () => { omniverse.joystick.input.attackHeld = true; },
      onEnd: () => { omniverse.joystick.input.attackHeld = false; }
    });
    this.jumpControl.create();
    this.interactControl.create();
    this.attackControl.create();
    omniverse.joystick.setActionControls([this.interactControl.element, this.attackControl.element, this.jumpControl.element]);
    this.setControlsVisible(true);
    omniverse.joystick.setVisible(true, true);
    omniverse.pause.setVisible(false);

    return true;
  }

  setControlsVisible(visible) {
    this.jumpControl?.setVisible(visible);
    this.interactControl?.setVisible(visible);
    this.attackControl?.setVisible(visible);
  }

  setPreludeVisible(visible) {
    if (this.prelude) this.prelude.style.display = visible ? "flex" : "none";
  }

  destroy() {
    this.element?.removeEventListener("click", this.onSelect);
    this.skip?.removeEventListener("click", this.onSkip);
    this.element?.remove();
    this.prelude?.remove();
    this.jumpControl?.destroy();
    this.interactControl?.destroy();
    this.attackControl?.destroy();
  }
}
