import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { GameStateService } from '../state/game-state.service';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended';

export interface TimerState {
  durationSec: number;
  remainingSec: number;
  status: TimerStatus;
  lastTickAt: string | null;
}

const DEFAULT_DURATION_SEC = 30 * 60;

@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly gameState = inject(GameStateService);
  private timerStateSignal = signal<TimerState>(this.loadInitialState());

  private animationFrameId: number | null = null;
  private lastComputedAt = Date.now();

  readonly timerState = this.timerStateSignal.asReadonly();
  readonly remainingSec = computed(() => this.timerStateSignal().remainingSec);
  readonly status = computed(() => this.timerStateSignal().status);
  readonly isRunning = computed(() => this.timerStateSignal().status === 'running');
  readonly isAt30Seconds = computed(() => {
    const remaining = this.timerStateSignal().remainingSec;
    return remaining <= 30 && remaining > 0 && this.timerStateSignal().status === 'running';
  });
  readonly isEnded = computed(() => this.timerStateSignal().remainingSec <= 0);

  constructor() {
    // Keep timer state synchronized with shared persisted game state updates
    // (including storage-driven updates from other tabs).
    effect(() => {
      const sharedTimer = this.gameState.timer();
      this.timerStateSignal.set({
        durationSec: sharedTimer.durationSec,
        remainingSec: sharedTimer.remainingSec,
        status: sharedTimer.status,
        lastTickAt: sharedTimer.lastTickAt,
      });

      if (sharedTimer.status === 'running') {
        this.startTicking();
      } else {
        this.stopTicking();
      }
    });
  }

  start(durationSec: number = DEFAULT_DURATION_SEC): void {
    this.timerStateSignal.set({
      durationSec,
      remainingSec: durationSec,
      status: 'running',
      lastTickAt: new Date().toISOString(),
    });
    this.persistTimerState();
    this.startTicking();
  }

  pause(): void {
    this.timerStateSignal.update((state) => ({
      ...state,
      status: 'paused',
    }));
    this.persistTimerState();
    this.stopTicking();
  }

  resume(): void {
    this.timerStateSignal.update((state) => ({
      ...state,
      status: 'running',
      lastTickAt: new Date().toISOString(),
    }));
    this.persistTimerState();
    this.startTicking();
  }

  reset(durationSec: number = DEFAULT_DURATION_SEC): void {
    this.stopTicking();
    this.timerStateSignal.set({
      durationSec,
      remainingSec: durationSec,
      status: 'idle',
      lastTickAt: null,
    });
    this.persistTimerState();
  }

  setState(state: Partial<TimerState>): void {
    this.timerStateSignal.update((current) => ({
      ...current,
      ...state,
    }));
    this.persistTimerState();
  }

  getState(): TimerState {
    return this.timerStateSignal();
  }

  private startTicking(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    const tick = () => {
      this.updateRemainingTime();

      const newState = this.timerStateSignal();
      if (newState.status === 'running') {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stopTicking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updateRemainingTime(): void {
    this.timerStateSignal.update((state) => {
      if (state.status !== 'running' || !state.lastTickAt) {
        return state;
      }

      const now = Date.now();
      const lastTick = new Date(state.lastTickAt).getTime();
      const elapsedSec = Math.floor((now - lastTick) / 1000);

      if (elapsedSec === 0) {
        return state;
      }

      const nextRemaining = Math.max(0, state.remainingSec - elapsedSec);
      const nextStatus = nextRemaining <= 0 ? 'ended' : 'running';

      return {
        ...state,
        remainingSec: nextRemaining,
        status: nextStatus,
        lastTickAt: new Date().toISOString(),
      };
    });
    this.persistTimerState();

    this.lastComputedAt = Date.now();
  }

  private loadInitialState(): TimerState {
    const persisted = this.gameState.timer();
    if (!persisted) {
      return {
        durationSec: DEFAULT_DURATION_SEC,
        remainingSec: DEFAULT_DURATION_SEC,
        status: 'idle',
        lastTickAt: null,
      };
    }

    return {
      durationSec: persisted.durationSec ?? DEFAULT_DURATION_SEC,
      remainingSec: persisted.remainingSec ?? DEFAULT_DURATION_SEC,
      status: persisted.status ?? 'idle',
      lastTickAt: persisted.lastTickAt ?? null,
    };
  }

  private persistTimerState(): void {
    this.gameState.setTimerState(this.timerStateSignal());
  }

  ngOnDestroy(): void {
    this.stopTicking();
  }
}
