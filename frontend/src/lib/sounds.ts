/**
 * Sound Effects Manager
 * Handles all game audio effects with mute toggle
 */

class SoundManager {
  private isMuted = false;
  private audioContext: AudioContext | null = null;
  private musicVolume = 0.5;
  private sfxVolume = 0.7;

  constructor() {
    // Initialize audio context lazily
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play a beep sound with custom frequency
   */
  private playBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (this.isMuted || !this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      // Fade out
      gainNode.gain.setValueAtTime(this.sfxVolume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (e) {
      console.error('Sound error:', e);
    }
  }

  /**
   * Attack sound - crisp, energetic beep
   */
  playAttack() {
    this.playBeep(800, 0.15, 'square');
  }

  /**
   * Defense sound - lower tone, more sustained
   */
  playDefense() {
    this.playBeep(400, 0.2, 'sine');
  }

  /**
   * Damage taken - warning beep
   */
  playDamage() {
    this.playBeep(200, 0.1, 'sine');
    setTimeout(() => {
      this.playBeep(150, 0.1, 'sine');
    }, 60);
  }

  /**
   * Elimination sound - sad/fail tone
   */
  playElimination() {
    this.playBeep(300, 0.1, 'sine');
    setTimeout(() => {
      this.playBeep(200, 0.15, 'sine');
    }, 80);
    setTimeout(() => {
      this.playBeep(100, 0.2, 'sine');
    }, 160);
  }

  /**
   * Victory sound - ascending tones
   */
  playVictory() {
    this.playBeep(523, 0.1, 'sine'); // C5
    setTimeout(() => {
      this.playBeep(659, 0.1, 'sine'); // E5
    }, 120);
    setTimeout(() => {
      this.playBeep(784, 0.2, 'sine'); // G5
    }, 240);
  }

  /**
   * Round start sound - attention getter
   */
  playRoundStart() {
    this.playBeep(600, 0.08, 'square');
    setTimeout(() => {
      this.playBeep(600, 0.08, 'square');
    }, 100);
  }

  /**
   * Card select/submit sound
   */
  playSelect() {
    this.playBeep(900, 0.08, 'sine');
  }

  /**
   * Error/invalid action sound
   */
  playError() {
    this.playBeep(200, 0.15, 'sine');
  }

  /**
   * Submission complete
   */
  playSubmit() {
    this.playBeep(650, 0.1, 'sine');
    setTimeout(() => {
      this.playBeep(800, 0.1, 'sine');
    }, 80);
  }

  /**
   * Timer warning - beep as time runs out
   */
  playTimerWarning() {
    this.playBeep(1000, 0.08, 'square');
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Set mute state
   */
  setMute(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Get mute state
   */
  getMute() {
    return this.isMuted;
  }

  /**
   * Set sound effect volume (0-1)
   */
  setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get sound effect volume
   */
  getSfxVolume() {
    return this.sfxVolume;
  }
}

// Global instance
export const soundManager = new SoundManager();

// Export convenience functions
export const playAttack = () => soundManager.playAttack();
export const playDefense = () => soundManager.playDefense();
export const playDamage = () => soundManager.playDamage();
export const playElimination = () => soundManager.playElimination();
export const playVictory = () => soundManager.playVictory();
export const playRoundStart = () => soundManager.playRoundStart();
export const playSelect = () => soundManager.playSelect();
export const playError = () => soundManager.playError();
export const playSubmit = () => soundManager.playSubmit();
export const playTimerWarning = () => soundManager.playTimerWarning();
