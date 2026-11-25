export class AudioPlayer {
  constructor() {
    this.musicTrack = null;
    this.sfxTracks = new Set();
    this.unlocked = false;
    this.musicVolume = 0.55;
    this.sfxVolume = 0.7;
    this.audioContext = null;
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
      if (this.unlocked) this.audioContext.resume().catch(() => {});
      const source = this.audioContext.createMediaElementSource(track);
      const output = this.audioContext.createGain();
      output.gain.value = volume;
      source.connect(output).connect(this.audioContext.destination);
      this.trackNodes.set(track, { source, output });
    } catch (error) {
      track.volume = volume;
      console.warn("Audio processing could not be initialized:", error);
    }
  }

  stopMusic() {
    if (!this.musicTrack) return;
    this.musicTrack.pause();
    this.musicTrack.currentTime = 0;
    this.musicTrack.src = "";
    this.trackNodes.get(this.musicTrack)?.source.disconnect();
    this.trackNodes.get(this.musicTrack)?.output.disconnect();
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

    if (this.unlocked) this.startTrack(track, "music");
  }

  playSfx(source, onEnded = null) {
    const track = this.createTrack(source, false, this.sfxVolume);
    this.sfxTracks.add(track);
    track.addEventListener("ended", () => this.handleSfxEnded(track, onEnded), { once: true });
    track.addEventListener("error", () => this.handleTrackError(track, "SFX"), { once: true });

    if (this.unlocked) this.startTrack(track, "SFX");

    return track;
  }

  async startTrack(track, type) {
    try {
      if (this.audioContext?.state === "suspended") await this.audioContext.resume();
      await track.play();
    } catch (error) {
      console.warn(type + " playback could not start:", track.src, error);
    }
  }

  handleSfxEnded(track, onEnded) {
    this.sfxTracks.delete(track);
    const nodes = this.trackNodes.get(track);
    nodes?.source.disconnect(); nodes?.output.disconnect();
    this.trackNodes.delete(track);
    if (onEnded) onEnded();
  }

  handleTrackError(track, type) {
    this.sfxTracks.delete(track);
    this.trackNodes.get(track)?.source.disconnect();
    this.trackNodes.delete(track);
    console.error("Could not load " + type + ":", track.src);
  }

  stopSfx(track = null) {
    const tracks = track ? [track] : [...this.sfxTracks];

    for (const item of tracks) {
      item.pause();
      item.currentTime = 0;
      item.src = "";
      this.trackNodes.get(item)?.source.disconnect();
      this.trackNodes.get(item)?.output.disconnect();
      this.trackNodes.delete(item);
      this.sfxTracks.delete(item);
    }
  }

  unlock(stage, titleSong = "./files/songs/senji-v2-ov.mp3") {
    this.unlocked = true;
    if (this.audioContext?.state === "suspended") this.audioContext.resume().catch(() => {});

    if (stage === "title" && !this.musicTrack) {
      this.playMusic(titleSong);
    } else if (this.musicTrack?.paused) {
      this.startTrack(this.musicTrack, "music");
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
    this.unlocked = false;
  }
}
