import { Slider } from "./Slider.js";

export class CameraSensitivitySlider extends Slider {
  constructor({ value = 6, onChange = () => {} } = {}) {
    super({ label: "CAMERA SENSITIVITY", min: 1, max: 15, value, onInput: onChange });
  }
}