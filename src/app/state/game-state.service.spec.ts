import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';

describe('GameStateService', () => {
  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('should create the default grid and teams', () => {
    const service = TestBed.inject(GameStateService);

    expect(service.grid()).toHaveLength(64);
    expect(service.teams()).toHaveLength(6);
    expect(service.stabilityPercent()).toBe(0);
    expect(service.timer().remainingSec).toBe(30 * 60);
  });

  it('should persist state changes to localStorage', () => {
    const service = TestBed.inject(GameStateService);

    service.updateCell(1, { state: 'confirmed', teamId: 'team-1' });

    const storedValue = window.localStorage.getItem('speed-shapes-time-breach.game-state');
    expect(storedValue).toBeTruthy();

    const snapshot = JSON.parse(storedValue as string) as { schemaVersion: number; state: { grid: Array<{ index: number; state: string; teamId: string | null }> } };
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.state.grid[0].state).toBe('confirmed');
    expect(snapshot.state.grid[0].teamId).toBe('team-1');
  });

  it('should reset only the board state and keep teams and timer intact', () => {
    const service = TestBed.inject(GameStateService);

    service.assignPendingCell(1, 'team-1');
    service.confirmPendingCell(1);
    service.setTimerState({ status: 'running', remainingSec: 1200 });
    service.resetBoardState();

    expect(service.grid().every((cell) => cell.state === 'empty')).toBe(true);
    expect(service.connections()).toEqual([]);
    expect(service.pendingQuestionIds()).toEqual({});
    expect(service.teams()).toHaveLength(6);
    expect(service.timer().remainingSec).toBe(1200);
    expect(service.timer().status).toBe('running');
  });

  it('should create a 3-cell connection and mark those cells as used', () => {
    const service = TestBed.inject(GameStateService);

    service.assignPendingCell(1, 'team-1');
    service.confirmPendingCell(1);
    service.assignPendingCell(2, 'team-1');
    service.confirmPendingCell(2);
    service.assignPendingCell(3, 'team-1');
    service.confirmPendingCell(3);

    expect(service.connections()).toHaveLength(1);

    const connected = service.connections()[0].cellIndices;
    expect(connected).toEqual([1, 2, 3]);

    const connectedCells = service.grid().filter((cell) => connected.includes(cell.index));
    expect(connectedCells.every((cell) => cell.state === 'used')).toBe(true);
    expect(new Set(connectedCells.map((cell) => cell.connectionId)).size).toBe(1);
  });

  it('should create only one connection from a longer chain and include the newly confirmed cell', () => {
    const service = TestBed.inject(GameStateService);

    service.assignPendingCell(1, 'team-1');
    service.confirmPendingCell(1);
    service.assignPendingCell(2, 'team-1');
    service.confirmPendingCell(2);
    service.assignPendingCell(4, 'team-1');
    service.confirmPendingCell(4);
    service.assignPendingCell(5, 'team-1');
    service.confirmPendingCell(5);
    service.assignPendingCell(3, 'team-1');
    service.confirmPendingCell(3);

    expect(service.connections()).toHaveLength(1);

    const connection = service.connections()[0];
    expect(connection.cellIndices).toContain(3);

    const usedCount = service.grid().filter((cell) => cell.state === 'used').length;
    expect(usedCount).toBe(3);
  });
});