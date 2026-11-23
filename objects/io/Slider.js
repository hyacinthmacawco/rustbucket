export class Slider {
  constructor({ label, min = 0, max = 100, value = 50, onInput = () => {} } = {}) {
    this.label = label;
    this.min = min;
    this.max = max;
    this.value = value;
    this.onInput = onInput;
    this.styles = {
      row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "10px 0", borderBottom: "1px solid rgba(126,255,168,.16)" },
      input: { accentColor: "#72f89b" }
    };
  }

  create() {
    this.element = document.createElement("label");
    this.element.textContent = this.label;
    Object.assign(this.element.style, this.styles.row);
    this.input = document.createElement("input");
    this.input.type = "range";
    this.input.min = String(this.min);
    this.input.max = String(this.max);
    this.input.value = String(this.value);
    Object.assign(this.input.style, this.styles.input);
    this.input.addEventListener("input", this.handleInput);
    this.element.append(this.input);
    return this.element;
  }

  handleInput = () => {
    this.value = Number(this.input.value);
    this.onInput(this.value);
  };

  destroy() {
    this.input?.removeEventListener("input", this.handleInput);
    this.element?.remove();
  }
}