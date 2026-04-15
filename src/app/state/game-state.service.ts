import { Injectable, computed, signal } from '@angular/core';
import { Cell, Connection, GameSnapshot, GameState, Team, TimerState } from './game-state.models';

const STORAGE_KEY = 'speed-shapes-time-breach.game-state';
const SCHEMA_VERSION = 1;
const GRID_SIZE = 64;
const GRID_SIDE = 8;
const DEFAULT_TIMER_DURATION_SEC = 30 * 60;

type DirectionName = Connection['direction'];

interface DirectionVector {
  name: DirectionName;
  rowStep: number;
  colStep: number;
}

interface ConnectionCandidate {
  direction: DirectionName;
  chainLength: number;
  cellIndices: [number, number, number];
}

const DIRECTIONS: DirectionVector[] = [
  { name: 'horizontal', rowStep: 0, colStep: 1 },
  { name: 'vertical', rowStep: 1, colStep: 0 },
  { name: 'diagonal-down-right', rowStep: 1, colStep: 1 },
  { name: 'diagonal-down-left', rowStep: 1, colStep: -1 },
];

const DEFAULT_TEAMS: Team[] = [
  { id: 'team-1', name: 'Alpha', color: '#11d6ff', shape: 'circle' },
  { id: 'team-2', name: 'Beta', color: '#9f72ff', shape: 'diamond' },
  { id: 'team-3', name: 'Gamma', color: '#54f0b3', shape: 'triangle' },
  { id: 'team-4', name: 'Delta', color: '#ffb347', shape: 'square' },
  { id: 'team-5', name: 'Epsilon', color: '#ff6b9a', shape: 'hexagon' },
  { id: 'team-6', name: 'Zeta', color: '#7f8cff', shape: 'star' },
];

function createInitialGrid(): Cell[] {
  return Array.from({ length: GRID_SIZE }, (_, index) => ({
    index: index + 1,
    state: 'empty',
    teamId: null,
    questionId: null,
    connectionId: null,
  }));
}

function createInitialTimer(): TimerState {
  return {
    durationSec: DEFAULT_TIMER_DURATION_SEC,
    remainingSec: DEFAULT_TIMER_DURATION_SEC,
    status: 'idle',
    lastTickAt: null,
  };
}

function createInitialState(): GameState {
  return {
    version: SCHEMA_VERSION,
    teams: DEFAULT_TEAMS,
    grid: createInitialGrid(),
    connections: [],
    timer: createInitialTimer(),
    pendingQuestionIds: {},
    resolvedQuestionIds: [],
  };
}

function isGameState(value: unknown): value is GameState {
  return typeof value === 'object' && value !== null;
}

function indexToPosition(index: number): { row: number; col: number } {
  const zeroBased = index - 1;
  return {
    row: Math.floor(zeroBased / GRID_SIDE),
    col: zeroBased % GRID_SIDE,
  };
}

function positionToIndex(row: number, col: number): number | null {
  if (row < 0 || row >= GRID_SIDE || col < 0 || col >= GRID_SIDE) {
    return null;
  }

  return row * GRID_SIDE + col + 1;
}

function buildConnectionId(): string {
  return `conn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly storageAvailable = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  private readonly stateSignal = signal<GameState>(this.loadState());

  readonly state = this.stateSignal.asReadonly();
  readonly teams = computed(() => this.stateSignal().teams);
  readonly grid = computed(() => this.stateSignal().grid);
  readonly connections = computed(() => this.stateSignal().connections);
  readonly timer = computed(() => this.stateSignal().timer);
  readonly pendingQuestionIds = computed(() => this.stateSignal().pendingQuestionIds);
  readonly stabilityPercent = computed(() => {
    const confirmedCount = this.stateSignal().grid.filter((cell) => cell.state === 'confirmed' || cell.state === 'used').length;
    return Math.round((confirmedCount / GRID_SIZE) * 100);
  });

  resetState(): void {
    this.stateSignal.set(createInitialState());
    this.persistState();
  }

  reloadFromStorage(): void {
    this.stateSignal.set(this.loadState());
  }

  resetBoardState(): void {
    this.updateState((state) => ({
      ...state,
      grid: createInitialGrid(),
      connections: [],
      pendingQuestionIds: {},
      resolvedQuestionIds: [],
    }));
  }

  replaceState(nextState: GameState): void {
    this.stateSignal.set(this.normalizeState(nextState));
    this.persistState();
  }

  updateTeam(teamId: string, patch: Partial<Team>): void {
    this.updateState((state) => ({
      ...state,
      teams: state.teams.map((team) => (team.id === teamId ? { ...team, ...patch } : team)),
    }));
  }

  updateCell(cellIndex: number, patch: Partial<Cell>): void {
    this.updateState((state) => ({
      ...state,
      grid: state.grid.map((cell) => (cell.index === cellIndex ? { ...cell, ...patch } : cell)),
    }));
  }

  assignPendingCell(cellIndex: number, teamId: string): void {
    this.updateState((state) => {
      const questionId = String(cellIndex);

      const nextGrid: Cell[] = state.grid.map((cell): Cell => {
        if (cell.teamId === teamId && cell.state === 'pending' && cell.index !== cellIndex) {
          return {
            ...cell,
            state: 'empty',
            teamId: null,
            questionId: null,
            connectionId: null,
          };
        }

        if (cell.index === cellIndex) {
          return {
            ...cell,
            state: 'pending',
            teamId,
            questionId,
            connectionId: null,
          };
        }

        return cell;
      });

      return {
        ...state,
        grid: nextGrid,
        pendingQuestionIds: {
          ...state.pendingQuestionIds,
          [teamId]: cellIndex,
        },
      };
    });
  }

  confirmPendingCell(cellIndex: number): void {
    this.updateState((state) => {
      const targetCell = state.grid.find((cell) => cell.index === cellIndex);
      if (!targetCell || targetCell.state !== 'pending' || !targetCell.teamId) {
        return state;
      }

      const nextGrid: Cell[] = state.grid.map((cell): Cell =>
        cell.index === cellIndex
          ? {
              ...cell,
              state: 'confirmed',
            }
          : cell,
      );

      const nextPending = { ...state.pendingQuestionIds };
      delete nextPending[targetCell.teamId];

      const nextState: GameState = {
        ...state,
        grid: nextGrid,
        pendingQuestionIds: nextPending,
      };

      return this.applyConnectionAfterConfirm(nextState, cellIndex, targetCell.teamId);
    });
  }

  rejectPendingCell(cellIndex: number): void {
    this.updateState((state) => {
      const targetCell = state.grid.find((cell) => cell.index === cellIndex);
      if (!targetCell || targetCell.state !== 'pending' || !targetCell.teamId) {
        return state;
      }

      const nextGrid: Cell[] = state.grid.map((cell): Cell =>
        cell.index === cellIndex
          ? {
              ...cell,
              state: 'empty',
              teamId: null,
              questionId: null,
              connectionId: null,
            }
          : cell,
      );

      const nextPending = { ...state.pendingQuestionIds };
      delete nextPending[targetCell.teamId];

      return {
        ...state,
        grid: nextGrid,
        pendingQuestionIds: nextPending,
      };
    });
  }

  setTimerState(timer: Partial<TimerState>): void {
    this.updateState((state) => ({
      ...state,
      timer: { ...state.timer, ...timer },
    }));
  }

  addConnection(connection: Connection): void {
    this.updateState((state) => ({
      ...state,
      connections: [...state.connections, connection],
    }));
  }

  markQuestionPending(questionId: number, teamId: string): void {
    this.updateState((state) => ({
      ...state,
      pendingQuestionIds: {
        ...state.pendingQuestionIds,
        [teamId]: questionId,
      },
    }));
  }

  clearPendingQuestion(teamId: string): void {
    this.updateState((state) => {
      const nextPending = { ...state.pendingQuestionIds };
      delete nextPending[teamId];

      return {
        ...state,
        pendingQuestionIds: nextPending,
      };
    });
  }

  resolveQuestion(questionId: number): void {
    this.updateState((state) => {
      if (state.resolvedQuestionIds.includes(questionId)) {
        return state;
      }

      return {
        ...state,
        resolvedQuestionIds: [...state.resolvedQuestionIds, questionId],
      };
    });
  }

  getStateSnapshot(): GameSnapshot {
    return this.serialize(this.stateSignal());
  }

  private applyConnectionAfterConfirm(state: GameState, confirmedIndex: number, teamId: string): GameState {
    const gridByIndex = new Map<number, Cell>(state.grid.map((cell) => [cell.index, cell]));
    const targetCell = gridByIndex.get(confirmedIndex);
    if (!targetCell || targetCell.connectionId) {
      return state;
    }

    const candidates = this.collectConnectionCandidates(gridByIndex, confirmedIndex, teamId);
    if (!candidates.length) {
      return state;
    }

    const bestChainLength = Math.max(...candidates.map((candidate) => candidate.chainLength));
    const prioritized = candidates.filter((candidate) => candidate.chainLength === bestChainLength);
    const picked = prioritized[Math.floor(Math.random() * prioritized.length)];
    const connectionId = buildConnectionId();

    const pickedIndexSet = new Set<number>(picked.cellIndices);
    const nextGrid = state.grid.map((cell): Cell => {
      if (!pickedIndexSet.has(cell.index)) {
        return cell;
      }

      return {
        ...cell,
        state: 'used',
        connectionId,
      };
    });

    const nextConnection: Connection = {
      id: connectionId,
      cellIndices: picked.cellIndices,
      teamId,
      direction: picked.direction,
      createdAt: new Date().toISOString(),
    };

    return {
      ...state,
      grid: nextGrid,
      connections: [...state.connections, nextConnection],
    };
  }

  private collectConnectionCandidates(
    gridByIndex: Map<number, Cell>,
    centerIndex: number,
    teamId: string,
  ): ConnectionCandidate[] {
    const centerPosition = indexToPosition(centerIndex);
    const candidates: ConnectionCandidate[] = [];

    for (const direction of DIRECTIONS) {
      const chain = this.collectDirectionalChain(gridByIndex, centerPosition.row, centerPosition.col, direction, teamId);
      if (chain.length < 3) {
        continue;
      }

      for (let i = 0; i <= chain.length - 3; i += 1) {
        const slice = chain.slice(i, i + 3);
        if (!slice.includes(centerIndex)) {
          continue;
        }

        if (slice.some((index) => gridByIndex.get(index)?.connectionId)) {
          continue;
        }

        candidates.push({
          direction: direction.name,
          chainLength: chain.length,
          cellIndices: [slice[0], slice[1], slice[2]],
        });
      }
    }

    return candidates;
  }

  private collectDirectionalChain(
    gridByIndex: Map<number, Cell>,
    centerRow: number,
    centerCol: number,
    direction: DirectionVector,
    teamId: string,
  ): number[] {
    const backward: number[] = [];
    const forward: number[] = [];

    this.walkDirection(gridByIndex, centerRow, centerCol, -direction.rowStep, -direction.colStep, teamId, backward);
    this.walkDirection(gridByIndex, centerRow, centerCol, direction.rowStep, direction.colStep, teamId, forward);

    const centerIndex = positionToIndex(centerRow, centerCol);
    if (!centerIndex) {
      return [];
    }

    return [...backward.reverse(), centerIndex, ...forward];
  }

  private walkDirection(
    gridByIndex: Map<number, Cell>,
    originRow: number,
    originCol: number,
    rowStep: number,
    colStep: number,
    teamId: string,
    target: number[],
  ): void {
    let row = originRow + rowStep;
    let col = originCol + colStep;

    while (true) {
      const index = positionToIndex(row, col);
      if (!index) {
        return;
      }

      const cell = gridByIndex.get(index);
      if (!cell || cell.state !== 'confirmed' || cell.teamId !== teamId || cell.connectionId) {
        return;
      }

      target.push(index);
      row += rowStep;
      col += colStep;
    }
  }

  private updateState(updater: (state: GameState) => GameState): void {
    this.stateSignal.update((currentState) => this.normalizeState(updater(currentState)));
    this.persistState();
  }

  private persistState(): void {
    if (!this.storageAvailable) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.serialize(this.stateSignal())));
  }

  private loadState(): GameState {
    if (!this.storageAvailable) {
      return createInitialState();
    }

    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);
      if (!rawValue) {
        return createInitialState();
      }

      const snapshot = JSON.parse(rawValue) as Partial<GameSnapshot>;
      if (snapshot.schemaVersion !== SCHEMA_VERSION || !isGameState(snapshot.state)) {
        return createInitialState();
      }

      return this.normalizeState(snapshot.state);
    } catch {
      return createInitialState();
    }
  }

  private serialize(state: GameState): GameSnapshot {
    return {
      schemaVersion: SCHEMA_VERSION,
      state: this.normalizeState(state),
    };
  }

  private normalizeState(state: Partial<GameState>): GameState {
    return {
      version: SCHEMA_VERSION,
      teams: Array.isArray(state.teams) && state.teams.length ? state.teams : DEFAULT_TEAMS,
      grid: Array.isArray(state.grid) && state.grid.length === GRID_SIZE ? state.grid : createInitialGrid(),
      connections: Array.isArray(state.connections) ? state.connections : [],
      timer: {
        ...createInitialTimer(),
        ...state.timer,
      },
      pendingQuestionIds: state.pendingQuestionIds ?? {},
      resolvedQuestionIds: state.resolvedQuestionIds ?? [],
    };
  }
}
