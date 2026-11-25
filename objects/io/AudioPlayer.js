export class AudioPlayer {
  constructor() {
    this.musicTrack = null;
    this.sfxTracks = new Set();
    this.unlocked = false;
    this.musicVolume = 0.55;
    this.sfxVolume = 0.7;
  }

  createTrack(source, loop, volume) {
    const track = new Audio(new URL(source, document.baseURI).href);
    track.loop = loop;
    track.volume = volume;
    track.preload = "auto";
    track.setAttribute("playsinline", "");
    this.connectTrack(track, volume);
    return track;
  }

  connectTrack(track, volume) {
    // Use native media playback directly. A Web Audio graph is unnecessary
    // for volume control and can leave music silent on mobile browsers.
    track.volume = volume;
  }

  stopMusic() {
    if (!this.musicTrack) return;
    this.musicTrack.pause();
    this.musicTrack.currentTime = 0;
    this.musicTrack.src = "";
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
      const playback = track.play();
      if (playback && typeof playback.then === "function") await playback;
    } catch (error) {
      console.warn(type + " playback could not start:", track.src, error);
    }
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

  unlock(stage, titleSong = "./files/songs/senji-v2-ov.opus") {
    this.unlocked = true;

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
    if (this.musicTrack) this.musicTrack.volume = value;
    for (const track of this.sfxTracks) track.volume = value;
  }

  destroy() {
    this.stopMusic();
    this.stopSfx();
    this.unlocked = false;
  }
}
