export class AudioPlayer {
  constructor() {
    this.musicTrack = null;
    this.sfxTracks = new Set();
    this.unlocked = false;
    this.musicVolume = 0.55;
    this.sfxVolume = 0.7;
    this.audioContext = null;
    this.reverb = null;
    this.trackNodes = new Map();
  }

  createTrack(source, loop, volume) {
    const track = new Audio(new URL(source, document.baseURI).href);
    track.loop = loop;
    track.volume = 1;
    track.preload = "auto";
    this.connectTrack(track, volume);
    return track;
  }

  connectTrack(track, volume) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) { track.volume = volume; return; }
    try {
      this.audioContext ||= new AudioContextClass();
      if (!this.reverb) {
        const length = Math.floor(this.audioContext.sampleRate * 2.4);
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = impulse.getChannelData(channel);
          for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.8);
        }
        this.reverb = this.audioContext.createConvolver();
        this.reverb.buffer = impulse;
      }
      const source = this.audioContext.createMediaElementSource(track);
      const dry = this.audioContext.createGain();
      const wet = this.audioContext.createGain();
      const output = this.audioContext.createGain();
      dry.gain.value = 0.78;
      wet.gain.value = 0.28;
      output.gain.value = volume;
      source.connect(dry).connect(output);
      source.connect(this.reverb).connect(wet).connect(output);
      output.connect(this.audioContext.destination);
      this.trackNodes.set(track, { source, dry, wet, output });
    } catch (error) {
      track.volume = volume;
      console.warn("Audio reverb could not be initialized:", error);
    }
  }

  stopMusic() {
    if (!this.musicTrack) return;
    this.musicTrack.pause();
    this.musicTrack.currentTime = 0;
    this.musicTrack.src = "";
    this.trackNodes.delete(this.musicTrack);
    this.musicTrack = null;
  }

  playSongs(songs = []) {
    if (!Array.isArray(songs) || songs.length === 0) return;
    const choices = songs.filter(Boolean);
    if (!choices.length) return;
    const current = this.musicTrack?.src;
    const available = choices.filter(song => new URL(song, document.baseURI).href !== current);
    const list = available.length ? available : choices;
    this.playMusic(list[Math.floor(Math.random() * list.length)]);
  }

  playMusic(source) {
    this.stopMusic();
    const track = this.createTrack(source, true, this.musicVolume);
    track.addEventListener("error", () => this.handleTrackError(track, "music"), { once: true });
    this.musicTrack = track;

    if (this.unlocked) {
      track.play().catch(error => console.warn("Music playback is waiting for interaction:", error));
    }
  }

  playSfx(source, onEnded = null) {
    const track = this.createTrack(source, false, this.sfxVolume);
    this.sfxTracks.add(track);
    track.addEventListener("ended", () => this.handleSfxEnded(track, onEnded), { once: true });
    track.addEventListener("error", () => this.handleTrackError(track, "SFX"), { once: true });

    if (this.unlocked) {
      track.play().catch(error => console.warn("SFX playback is waiting for interaction:", error));
    }

    return track;
  }

  handleSfxEnded(track, onEnded) {
    this.sfxTracks.delete(track);
    if (onEnded) onEnded();
  }

  handleTrackError(track, type) {
    this.sfxTracks.delete(track);
    console.error("Could not load " + type + ":", track.src);
  }

  stopSfx(track = null) {
    const tracks = track ? [track] : [...this.sfxTracks];

    for (const item of tracks) {
      item.pause();
      item.currentTime = 0;
      item.src = "";
      this.sfxTracks.delete(item);
    }
  }

  unlock(stage, titleSong = "./files/songs/senji-v2-ov.mp3") {
    this.unlocked = true;
    this.audioContext?.resume?.();

    if (stage === "title" && !this.musicTrack) {
      this.playMusic(titleSong);
    } else if (this.musicTrack?.paused) {
      this.musicTrack.play().catch(error => console.warn("Music playback is waiting for interaction:", error));
    }
  }

  setMasterVolume(volume) {
    const value = Math.max(0, Math.min(1, Number(volume)));
    this.musicVolume = value;
    this.sfxVolume = value;
    if (this.musicTrack) { const nodes = this.trackNodes.get(this.musicTrack); if (nodes) nodes.output.gain.value = value; else this.musicTrack.volume = value; }
    for (const track of this.sfxTracks) { const nodes = this.trackNodes.get(track); if (nodes) nodes.output.gain.value = value; else track.volume = value; }
  }

  destroy() {
    this.stopMusic();
    this.stopSfx();
    this.trackNodes.clear();
    this.audioContext?.close?.();
    this.audioContext = null;
    this.reverb = null;
    this.unlocked = false;
  }
}
