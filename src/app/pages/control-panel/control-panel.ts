import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Grid } from '../../components/grid/grid';
import { SoundService } from '../../services/sound.service';
import { TimerService } from '../../services/timer.service';
import { GameStateService } from '../../state/game-state.service';
import { UndoService } from '../../state/undo.service';
import { GameState } from '../../state/game-state.models';
import { ExportService } from '../../services/export.service';
 
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
  private readonly exportService = inject(ExportService);
 
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
    if (!selected) return null;
    return this.grid().find((cell) => cell.index === selected) ?? null;
  });
 
  onCellSelected(cellIndex: number): void {
    this.selectedCellIndex.set(cellIndex);
  }
 
  // ── Undoable helpers ────────────────────────────────────────────────────────
 
  /**
   * Captures the full state snapshot BEFORE the mutation, executes the
   * mutation, then registers an undo command that restores the snapshot.
   */
  private executeUndoable(label: string, mutation: () => void): void {
    const before: GameState = structuredClone(this.gameState.state());
    mutation();
    const after: GameState = structuredClone(this.gameState.state());
 
    this.undoService.registerCommand({
      id: `${label}-${Date.now()}`,
      label,
      previousState: before,
      nextState: after,
      execute: () => this.gameState.replaceState(after),
      undo: () => this.gameState.replaceState(before),
    });
  }
 
  // ── Actions ──────────────────────────────────────────────────────────────────
 
  assignPending(): void {
    const cellIndex = this.selectedCellIndex();
    if (!cellIndex) return;
    this.executeUndoable('Assign Pending', () => {
      this.gameState.assignPendingCell(cellIndex, this.selectedTeamId());
    });
  }
 
  confirmSelected(): void {
    const cellIndex = this.selectedCellIndex();
    if (!cellIndex) return;
 
    const beforeConnections = this.connections().length;
 
    this.executeUndoable('Mark Correct', () => {
      this.gameState.confirmPendingCell(cellIndex);
    });
 
    this.sound.playCorrect();
    if (this.connections().length > beforeConnections) {
      this.sound.playConnection();
    }
  }
 
  rejectSelected(): void {
    const cellIndex = this.selectedCellIndex();
    if (!cellIndex) return;
 
    this.executeUndoable('Mark Wrong', () => {
      this.gameState.rejectPendingCell(cellIndex);
    });
    this.sound.playWrong();
  }
 
  clearSelected(): void {
    const cell = this.selectedCell();
    if (!cell) return;
 
    if (cell.state === 'pending') {
      this.executeUndoable('Clear Pending Cell', () => {
        this.gameState.rejectPendingCell(cell.index);
      });
      return;
    }
 
    this.executeUndoable('Clear Cell', () => {
      this.gameState.updateCell(cell.index, {
        state: 'empty',
        teamId: null,
        questionId: null,
        connectionId: null,
      });
    });
  }
 
  resetBoard(): void {
    // Board reset is intentionally NOT undoable — it's a destructive operator
    // action that clears everything. Undo history is also cleared.
    this.gameState.resetBoardState();
    this.undoService.clear();
    this.selectedCellIndex.set(null);
  }

    // ── export json+png ────────────────────────────────────────────────────────────────────
  exportJson(): void {
    this.exportService.exportJson();
  }

  exportPng(): void {
    this.exportService.exportPng();  // no element needed
}
 
 
  // ── Timer ────────────────────────────────────────────────────────────────────
 
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
 
  // ── Sound ────────────────────────────────────────────────────────────────────
 
  setSoundMuted(nextMuted: boolean): void {
    this.sound.setMuted(nextMuted);
  }
 
  setSoundVolume(nextVolume: string | number): void {
    this.sound.setVolume(Number(nextVolume));
  }
 
  // ── Timer formatting ─────────────────────────────────────────────────────────
 
  formatRemainingTimer(): string {
    const remaining = Math.max(0, this.timerRemainingSec());
    const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
    const seconds = Math.floor(remaining % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
 
  // ── Undo/Redo ─────────────────────────────────────────────────────────────────
 
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
    } else if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === 'y' || (event.shiftKey && event.key === 'Z'))
    ) {
      event.preventDefault();
      this.redo();
    }
  }
}