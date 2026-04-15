export type CellState = 'empty' | 'pending' | 'confirmed' | 'used';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended';

export interface Team {
  id: string;
  name: string;
  color: string;
  shape: string;
}

export interface Cell {
  index: number;
  state: CellState;
  teamId: string | null;
  questionId: string | null;
  connectionId: string | null;
}

export interface Connection {
  id: string;
  cellIndices: [number, number, number];
  teamId: string | null;
  direction: 'horizontal' | 'vertical' | 'diagonal-down-right' | 'diagonal-down-left';
  createdAt: string;
}

export interface TimerState {
  durationSec: number;
  remainingSec: number;
  status: TimerStatus;
  lastTickAt: string | null;
}

export interface GameState {
  version: number;
  teams: Team[];
  grid: Cell[];
  connections: Connection[];
  timer: TimerState;
  pendingQuestionIds: Record<string, number>;
  resolvedQuestionIds: number[];
}

export interface GameSnapshot {
  schemaVersion: number;
  state: GameState;
}