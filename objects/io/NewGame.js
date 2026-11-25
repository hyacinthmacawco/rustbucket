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
import { POV } from "../team/POV.js";
import { Ramp } from "../team/Ramp.js";

export class NewGame {
  static helpText = "WASD / joystick: Move.\nDrag / swipe: Rotate the camera.\nMouse wheel / pinch: Zoom.\nF / joystick centre: Switch team member.\nSpace / JUMP: Open the system map when Rustbucket is selected.\nClick bags: Pick up or drop them.\nClick markets: Open the shop.\nClick visiting species: Board or leave them at a planet.\nQ / ATTACK: Attack hostile characters.\nR: Open or close the Rustbucket ramp.\n1P / 3P: Toggle first-person and third-person view.\nPAUSE: Open settings, help and credits.\nEXTRANET: Open the Private Cloud browser.";

  constructor({ omniverse = null, onSelect = () => {}, onSkip = () => {} } = {}) {
    this.omniverse = omniverse;
    this.onSelect = onSelect;
    this.onSkip = onSkip;
    this.initialized = false;
    this.styles = {
      button: { padding: "14px 24px", background: "rgba(5,22,14,.76)", color: "#eaffef", font: "inherit", letterSpacing: ".16em", cursor: "pointer" },
      prelude: { position: "fixed", inset: "0", display: "none", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "28px", background: "#000", color: "#fff", zIndex: "50", font: "inherit", letterSpacing: ".18em" },
      heading: { maxWidth: "min(88vw, 760px)", maxHeight: "70vh", overflowY: "auto", padding: "0 22px", fontSize: "clamp(12px, 2vw, 17px)", lineHeight: "1.8", letterSpacing: ".06em", textAlign: "left", whiteSpace: "pre-line", fontFamily: "\\"Industry Light\\", sans-serif", fontWeight: "300" },
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
    this.heading.textContent = NewGame.helpText;
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
    omniverse.firstPerson = false;
    omniverse.thirdPersonOffset = null;

    omniverse.clearWorld();
    omniverse.earth = new Earth();
    omniverse.earth.enter(omniverse);
    omniverse.crewHomePlanet = omniverse.earth;
    omniverse.vehicleSystem = "solar";

    omniverse.vehicle = new Rustbucket(omniverse.celestial);
    omniverse.vehicle.ship.position.set(0, 3.54, 34);
    omniverse.vehicle.setRescueContext({
      getCurrentPlanet: () => omniverse.currentPlanet,
      getResidents: () => omniverse.residents || [],
      account: omniverse.account,
      onUpdate: () => omniverse.updateAccountHUD(),
      onPickup: resident => omniverse.handleRescuePickup(resident),
      onDrop: (resident, relationshipIncrease, taydeniteIncrease) => omniverse.handleRescueDrop(resident, relationshipIncrease, taydeniteIncrease),
      onBoard: resident => omniverse.setResidentAboard(resident, true),
      onUnboard: resident => omniverse.setResidentAboard(resident, false)
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
    omniverse.bags.forEach(bag => omniverse.registerBagPhysics(bag));
    omniverse.attachObjectClickHandlers();
    omniverse.crew.forEach((member, index) => {
      member.automation = { bag: omniverse.bags[index], seatIndex: index, phase: "toBag", elapsed: 0 };
      member.carryingBag = null;
      member.seated = false;
    });
    omniverse.vehicle.setRamp(true);
    omniverse.registerVehiclePhysics(omniverse.vehicle);
    omniverse.crew.forEach(member => omniverse.registerPhysicsBody(member.group, member, member.group.userData.collisionCapsule));

    omniverse.joystick?.destroy();
    this.jumpControl?.destroy();
    this.attackControl?.destroy();
    this.povControl?.destroy();
    this.rampControl?.destroy();
    omniverse.joystick = new Joystick();
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    const entities = {
      ben: omniverse.crew[0].group,
      gwen: omniverse.crew[1].group,
      kevin: omniverse.crew[2].group,
      rook: omniverse.crew[3].group,
      rustbucket: omniverse.vehicle.ship
    };
    omniverse.joystick.onAttack = selected => omniverse.handleCombatAttack(selected);
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
      onMove: (object, dx, dz) => omniverse.moveCharacterWithCollisions(object, dx, dz),
      onToggleRamp: () => omniverse.vehicle?.toggleRamp(),
      onTransformationChange: form => omniverse.crew[0]?.setTransformation(form),
      initialSelected: "ben"
    });
    this.jumpControl = new Jump({ onPress: () => { omniverse.joystick.input.jumpRequested = true; } });
    this.povControl = new POV({ onToggle: enabled => omniverse.setPOV(enabled) });
    this.rampControl = new Ramp({ onPress: () => omniverse.vehicle?.toggleRamp() });
    this.attackControl = new Attack({
      onStart: () => {
        const selected = omniverse.joystick.currentSelection;
        omniverse.joystick.input.attackHeld = true;
        omniverse.joystick.lastAttackAt = performance.now();
        if (selected === "rustbucket") omniverse.vehicle?.performAttack();
        else omniverse.handleCombatAttack(selected);
      },
      onEnd: () => {
        if (omniverse.joystick) omniverse.joystick.input.attackHeld = false;
      }
    });
    this.jumpControl.create();
    this.attackControl.create();
    this.povControl.create();
    this.rampControl.create();
    omniverse.joystick.setActionControls([this.attackControl.element, this.jumpControl.element, this.povControl.element, omniverse.helixButton, this.rampControl.element]);
    this.setControlsVisible(true);
    omniverse.joystick.setVisible(true, true);
    omniverse.pause.setVisible(false);

    return true;
  }

  setControlsVisible(visible) {
    this.jumpControl?.setVisible(visible);
    this.attackControl?.setVisible(visible);
    this.povControl?.setVisible(visible);
    this.rampControl?.setVisible(visible);
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
    this.attackControl?.destroy();
    this.povControl?.destroy();
    this.rampControl?.destroy();
  }
}
