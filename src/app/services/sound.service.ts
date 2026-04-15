import { Injectable, signal } from '@angular/core';

type SoundKind = 'correct' | 'wrong' | 'connection' | 'time-up' | 'tick';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tickingIntervalId: number | null = null;
  private lastPlayedAt = new Map<SoundKind, number>();

  readonly muted = signal(false);
  readonly volume = signal(0.45);

  setMuted(nextMuted: boolean): void {
    this.muted.set(nextMuted);
    this.syncGain();
  }

  setVolume(nextVolume: number): void {
    const clamped = Math.max(0, Math.min(1, nextVolume));
    this.volume.set(clamped);
    this.syncGain();
  }

  playCorrect(): void {
    this.playToneSequence('correct', [
      { freq: 730, durationMs: 70, gain: 0.24 },
      { freq: 920, durationMs: 85, gain: 0.28 },
    ]);
  }

  playWrong(): void {
    this.playToneSequence('wrong', [
      { freq: 300, durationMs: 95, gain: 0.24 },
      { freq: 210, durationMs: 140, gain: 0.2 },
    ]);
  }

  playConnection(): void {
    this.playToneSequence('connection', [
      { freq: 510, durationMs: 60, gain: 0.2 },
      { freq: 640, durationMs: 65, gain: 0.24 },
      { freq: 820, durationMs: 95, gain: 0.28 },
    ]);
  }

  playTimeUp(): void {
    this.playToneSequence('time-up', [
      { freq: 170, durationMs: 240, gain: 0.35 },
      { freq: 130, durationMs: 310, gain: 0.38 },
      { freq: 170, durationMs: 280, gain: 0.35 },
    ]);
  }

  startTicking(): void {
    if (this.tickingIntervalId !== null) {
      return;
    }

    this.playTick();
    this.tickingIntervalId = window.setInterval(() => {
      this.playTick();
    }, 500);
  }

  stopTicking(): void {
    if (this.tickingIntervalId === null) {
      return;
    }

    window.clearInterval(this.tickingIntervalId);
    this.tickingIntervalId = null;
  }

  private playTick(): void {
    this.playToneSequence('tick', [{ freq: 950, durationMs: 55, gain: 0.13 }], 120);
  }

  private playToneSequence(
    kind: SoundKind,
    notes: Array<{ freq: number; durationMs: number; gain: number }>,
    minGapMs: number = 80,
  ): void {
    if (this.muted()) {
      return;
    }

    const nowMs = Date.now();
    const lastMs = this.lastPlayedAt.get(kind) ?? 0;
    if (nowMs - lastMs < minGapMs) {
      return;
    }
    this.lastPlayedAt.set(kind, nowMs);

    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }

    let cursor = ctx.currentTime;
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, cursor);

      gain.gain.setValueAtTime(0.0001, cursor);
      gain.gain.exponentialRampToValueAtTime(note.gain, cursor + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, cursor + note.durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.masterGain as GainNode);

      osc.start(cursor);
      osc.stop(cursor + note.durationMs / 1000 + 0.015);

      cursor += note.durationMs / 1000;
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.syncGain();
    }

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }

    return this.audioContext;
  }

  private syncGain(): void {
    if (!this.masterGain) {
      return;
    }

    this.masterGain.gain.value = this.muted() ? 0 : this.volume();
  }
}
