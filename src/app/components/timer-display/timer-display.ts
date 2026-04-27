import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timer-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timer-display">
      <div class="time-value">
        <span class="minutes">{{ formatMinutes() }}</span>
        <span class="separator">:</span>
        <span class="seconds">{{ formatSeconds() }}</span>
      </div>
      <div class="status" [class.ended]="isEnded()">
        {{ status() === 'running' ? 'Running' : status() === 'paused' ? 'Paused' : 'Ended' }}
      </div>
    </div>
  `,
  styles: [`
    .timer-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem 0.9rem;
      border-radius: 0.75rem;
      background: var(--color-panel-bg);
      border: 2px solid var(--color-accent-cyan);
      font-variant-numeric: tabular-nums;
    }

    .time-value {
      font-size: clamp(0.8rem, 3.5vmin, 4.5rem);
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--color-accent-cyan);
      line-height: 1;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 0.1em;
    }

    .minutes {
      display: inline-block;
      min-width: auto;
      text-align: right;
      width: 2.5ch;
    }

    .separator {
      margin: 0;
      opacity: 0.9;
      flex-shrink: 0;
    }

    .seconds {
      display: inline-block;
      min-width: auto;
      width: 2.5ch;
    }

    .status {
      margin-top: 0.35rem;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .status.ended {
      color: #ff6b6b;
    }
  `]
})
export class TimerDisplayComponent {
  readonly remainingSec = input<number>(0);
  readonly status = input<'idle' | 'running' | 'paused' | 'ended'>('idle');

  readonly isEnded = computed(() => this.remainingSec() <= 0);

  formatMinutes(): string {
    const minutes = Math.floor(this.remainingSec() / 60);
    return String(minutes).padStart(2, '0');
  }

  formatSeconds(): string {
    const seconds = this.remainingSec() % 60;
    return String(seconds).padStart(2, '0');
  }
}
