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
    return track;
  }

  stopMusic() {
    if (!this.musicTrack) return;
    this.musicTrack.pause();
    this.musicTrack.currentTime = 0;
    this.musicTrack.src = "";
    this.musicTrack = null;
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

  unlock(stage) {
    this.unlocked = true;

    if (stage === "title" && !this.musicTrack) {
      this.playMusic("./files/songs/senji-v2-ov.mp3");
    } else if (this.musicTrack?.paused) {
      this.musicTrack.play().catch(error => console.warn("Music playback is waiting for interaction:", error));
    }
  }

  destroy() {
    this.stopMusic();
    this.stopSfx();
    this.unlocked = false;
  }
}
