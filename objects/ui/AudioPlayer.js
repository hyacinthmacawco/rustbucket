export class AudioPlayer {
  constructor() { this.musicTrack = null; this.sfxTracks = new Set(); this.unlocked = false; }
  stopMusic() {
    if (!this.musicTrack) return;
    this.musicTrack.pause(); this.musicTrack.currentTime = 0; this.musicTrack.src = ""; this.musicTrack = null;
  }
  playMusic(src) {
    this.stopMusic();
    const track = new Audio(new URL(src, document.baseURI).href);
    track.loop = true; track.volume = 0.55; track.preload = "auto";
    track.addEventListener("error", () => console.error("Could not load music:", track.src), { once: true });
    this.musicTrack = track;
    if (this.unlocked) track.play().catch(error => console.warn("Music playback is waiting for interaction:", error));
  }
  playSfx(src, onEnded = null) {
    const track = new Audio(new URL(src, document.baseURI).href);
    track.loop = false; track.volume = 0.7; track.preload = "auto"; this.sfxTracks.add(track);
    const cleanup = () => { this.sfxTracks.delete(track); if (onEnded) onEnded(); };
    track.addEventListener("ended", cleanup, { once: true });
    track.addEventListener("error", () => { this.sfxTracks.delete(track); console.error("Could not load SFX:", track.src); }, { once: true });
    if (this.unlocked) track.play().catch(error => console.warn("SFX playback is waiting for interaction:", error));
    return track;
  }
  stopSfx(track = null) {
    for (const item of (track ? [track] : [...this.sfxTracks])) {
      item.pause(); item.currentTime = 0; item.src = ""; this.sfxTracks.delete(item);
    }
  }
  unlock(stage) {
    this.unlocked = true;
    if (stage === "title" && !this.musicTrack) this.playMusic("./files/songs/senji-v2-ov.mp3");
    else if (this.musicTrack?.paused) this.musicTrack.play().catch(error => console.warn("Music playback is waiting for interaction:", error));
  }
}
