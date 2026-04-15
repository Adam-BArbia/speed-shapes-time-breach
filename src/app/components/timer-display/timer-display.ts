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
      font-size: clamp(1.2rem, 2.6vw, 2.1rem);
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--color-accent-cyan);
      line-height: 1;
      font-family: 'Courier New', monospace;
    }

    .minutes {
      display: inline-block;
      min-width: 2.5rem;
      text-align: right;
    }

    .separator {
      margin: 0 0.15em;
      opacity: 0.9;
    }

    .seconds {
      display: inline-block;
      min-width: 2.5rem;
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
