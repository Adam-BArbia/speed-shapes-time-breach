import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Grid } from '../../components/grid/grid';
import { SoundService } from '../../services/sound.service';
import { TimerService } from '../../services/timer.service';
import { GameStateService } from '../../state/game-state.service';
import { UndoService } from '../../state/undo.service';

@Component({
  selector: 'app-control-panel',
  imports: [FormsModule, Grid],
  templateUrl: './control-panel.html',
  styleUrl: './control-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlPanel {
  private readonly gameState = inject(GameStateService);
  private readonly undoService = inject(UndoService);
  private readonly sound = inject(SoundService);
  private readonly timerService = inject(TimerService);

  readonly grid = this.gameState.grid;
  readonly teams = this.gameState.teams;
  readonly connections = this.gameState.connections;
  readonly timerRemainingSec = this.timerService.remainingSec;
  readonly timerStatus = this.timerService.status;
  readonly soundMuted = this.sound.muted;
  readonly soundVolume = this.sound.volume;
  readonly selectedCellIndex = signal<number | null>(null);
  readonly selectedTeamId = signal<string>('team-1');
  readonly canUndo = this.undoService.canUndo;
  readonly canRedo = this.undoService.canRedo;

  readonly selectedCell = computed(() => {
    const selected = this.selectedCellIndex();
    if (!selected) {
      return null;
    }
    return this.grid().find((cell) => cell.index === selected) ?? null;
  });

  onCellSelected(cellIndex: number): void {
    this.selectedCellIndex.set(cellIndex);
  }

  assignPending(): void {
    const cellIndex = this.selectedCellIndex();
    if (!cellIndex) {
      return;
    }
    this.gameState.assignPendingCell(cellIndex, this.selectedTeamId());
  }

  confirmSelected(): void {
    const cellIndex = this.selectedCellIndex();
    if (!cellIndex) {
      return;
    }

    const beforeConnections = this.connections().length;
    this.gameState.confirmPendingCell(cellIndex);
    this.sound.playCorrect();

    if (this.connections().length > beforeConnections) {
      this.sound.playConnection();
    }
  }

  rejectSelected(): void {
    const cellIndex = this.selectedCellIndex();
    if (!cellIndex) {
      return;
    }
    this.gameState.rejectPendingCell(cellIndex);
    this.sound.playWrong();
  }

  clearSelected(): void {
    const cell = this.selectedCell();
    if (!cell) {
      return;
    }

    if (cell.state === 'pending') {
      this.gameState.rejectPendingCell(cell.index);
      return;
    }

    this.gameState.updateCell(cell.index, {
      state: 'empty',
      teamId: null,
      questionId: null,
      connectionId: null,
    });
  }

  resetBoard(): void {
    this.gameState.resetBoardState();
    this.selectedCellIndex.set(null);
  }

  startTimer(): void {
    this.timerService.start();
  }

  pauseTimer(): void {
    this.timerService.pause();
  }

  resumeTimer(): void {
    this.timerService.resume();
  }

  resetTimer(): void {
    this.timerService.reset();
  }

  setSoundMuted(nextMuted: boolean): void {
    this.sound.setMuted(nextMuted);
  }

  setSoundVolume(nextVolume: string | number): void {
    this.sound.setVolume(Number(nextVolume));
  }

  formatRemainingTimer(): string {
    const remaining = Math.max(0, this.timerRemainingSec());
    const minutes = Math.floor(remaining / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(remaining % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  undo(): void {
    this.undoService.undo();
  }

  redo(): void {
    this.undoService.redo();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      this.undo();
    } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.shiftKey && event.key === 'Z'))) {
      event.preventDefault();
      this.redo();
    }
  }
}
