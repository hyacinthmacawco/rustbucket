import { Slider } from "./Slider.js";

export class VolumeSlider extends Slider {
  constructor({ audioPlayer = null } = {}) {
    super({
      label: "MASTER VOLUME",
      min: 0,
      max: 100,
      value: audioPlayer ? Math.round(audioPlayer.musicVolume * 100) : 70,
      onInput: value => audioPlayer?.setMasterVolume(value / 100)
    });
    this.audioPlayer = audioPlayer;
  }
}