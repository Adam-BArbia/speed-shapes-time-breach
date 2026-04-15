import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Grid } from '../../components/grid/grid';
import { GameStateService } from '../../state/game-state.service';
import { SoundService } from '../../services/sound.service';
import { TimerService } from '../../services/timer.service';
import { Team } from '../../state/game-state.models';
import { QuestionBankService } from '../../state/question-bank.service';
import { TimerDisplayComponent } from '../../components/timer-display/timer-display';

@Component({
  selector: 'app-display-screen',
  imports: [Grid, TimerDisplayComponent],
  templateUrl: './display-screen.html',
  styleUrl: './display-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayScreen {
  private readonly gameState = inject(GameStateService);
  private readonly questionBank = inject(QuestionBankService);
  private readonly timerService = inject(TimerService);
  private readonly sound = inject(SoundService);
  private previousRemaining: number | null = null;

  readonly grid = this.gameState.grid;
  readonly teams = this.gameState.teams;
  readonly connections = this.gameState.connections;
  readonly stabilityPercent = this.gameState.stabilityPercent;
  readonly timerRemainingSec = this.timerService.remainingSec;
  readonly timerStatus = this.timerService.status;
  readonly pendingQuestionIds = this.gameState.pendingQuestionIds;

  readonly pendingQuestionsByTeam = computed(() => {
    const pendingByTeam = this.pendingQuestionIds();
    return this.teams().map((team) => ({
      team,
      questionId: pendingByTeam[team.id] ?? null,
      questionText: pendingByTeam[team.id] ? this.questionBank.getQuestionText(pendingByTeam[team.id]) : null,
    }));
  });

  constructor() {
    effect(() => {
      const status = this.timerStatus();
      const remaining = this.timerRemainingSec();

      if (status === 'running' && remaining <= 30 && remaining > 0) {
        this.sound.startTicking();
      } else {
        this.sound.stopTicking();
      }

      if (this.previousRemaining !== null && this.previousRemaining > 0 && remaining === 0) {
        this.sound.playTimeUp();
      }

      this.previousRemaining = remaining;
    });
  }

  trackTeam(_index: number, row: { team: Team }): string {
    return row.team.id;
  }

  ngOnDestroy(): void {
    this.sound.stopTicking();
  }
}
