import { Injectable, computed, signal } from '@angular/core';
import { GameState } from './game-state.models';

export interface UndoableCommand {
  id: string;
  label: string;
  previousState: GameState;
  nextState?: GameState;
  execute(): void;
  undo(): void;
}

const MAX_HISTORY_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class UndoService {
  private undoStackSignal = signal<UndoableCommand[]>([]);
  private redoStackSignal = signal<UndoableCommand[]>([]);

  readonly undoStack = this.undoStackSignal.asReadonly();
  readonly redoStack = this.redoStackSignal.asReadonly();

  readonly canUndo = computed(() => this.undoStackSignal().length > 0);
  readonly canRedo = computed(() => this.redoStackSignal().length > 0);

  readonly lastActionLabel = computed(() => {
    const lastUndo = this.undoStackSignal().at(-1);
    return lastUndo ? lastUndo.label : null;
  });

  registerCommand(command: UndoableCommand): void {
    if (this.undoStackSignal().length >= MAX_HISTORY_SIZE) {
      const nextStack = [...this.undoStackSignal()];
      nextStack.shift();
      this.undoStackSignal.set(nextStack);
    } else {
      this.undoStackSignal.update((stack) => [...stack, command]);
    }

    this.redoStackSignal.set([]);
  }

  undo(): void {
    const lastCommand = this.undoStackSignal().at(-1);
    if (!lastCommand) {
      return;
    }

    lastCommand.undo();

    this.undoStackSignal.update((stack) => {
      const nextStack = [...stack];
      nextStack.pop();
      return nextStack;
    });

    this.redoStackSignal.update((stack) => [...stack, lastCommand]);
  }

  redo(): void {
    const nextCommand = this.redoStackSignal().at(-1);
    if (!nextCommand) {
      return;
    }

    nextCommand.execute();

    this.redoStackSignal.update((stack) => {
      const nextStack = [...stack];
      nextStack.pop();
      return nextStack;
    });

    this.undoStackSignal.update((stack) => [...stack, nextCommand]);
  }

  clear(): void {
    this.undoStackSignal.set([]);
    this.redoStackSignal.set([]);
  }
}
