export class AudioPlayer {
  constructor() {
    this.musicTrack = null;
    this.musicOverride = null;
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
    if (this.musicTrack) {
      this.musicTrack.pause();
      this.musicTrack.currentTime = 0;
      this.musicTrack.src = "";
      this.musicTrack = null;
    }
    this.musicOverride = null;
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

  playOverrideMusic(source) {
    if (this.musicOverride) this.stopOverrideMusic();
    const previous = this.musicTrack;
    this.musicOverride = previous ? { source: previous.src, currentTime: previous.currentTime, loop: previous.loop } : null;
    if (previous) {
      previous.pause();
      previous.currentTime = 0;
      previous.src = "";
      this.musicTrack = null;
    }
    const track = this.createTrack(source, false, this.musicVolume);
    track.addEventListener("ended", () => { if (this.musicTrack === track) this.musicTrack = null; }, { once: true });
    track.addEventListener("error", () => this.handleTrackError(track, "music override"), { once: true });
    this.musicTrack = track;
    if (this.unlocked) this.startTrack(track, "music override");
    return track;
  }

  stopOverrideMusic() {
    const track = this.musicTrack;
    if (track) {
      track.pause();
      track.currentTime = 0;
      track.src = "";
      this.musicTrack = null;
    }
    const previous = this.musicOverride;
    this.musicOverride = null;
    if (!previous) return;
    const resumed = this.createTrack(previous.source, previous.loop, this.musicVolume);
    this.musicTrack = resumed;
    const restore = () => {
      try { resumed.currentTime = previous.currentTime; } catch (error) {}
      if (this.unlocked) this.startTrack(resumed, "music");
    };
    if (resumed.readyState >= 1) restore();
    else resumed.addEventListener("loadedmetadata", restore, { once: true });
    resumed.addEventListener("error", () => this.handleTrackError(resumed, "music"), { once: true });
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
