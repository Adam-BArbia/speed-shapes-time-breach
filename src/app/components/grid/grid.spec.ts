import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Grid } from './grid';
import { Cell, Connection, Team } from '../../state/game-state.models';

describe('Grid Component - Connection Visuals', () => {
  let component: Grid;
  let fixture: ComponentFixture<Grid>;

  const mockTeams: Team[] = [
    {
      id: 'team-1',
      name: 'Red Team',
      color: '#FF0000',
      shape: 'circle',
    },
  ];

  const mockCells: Cell[] = Array.from({ length: 64 }, (_, i) => ({
    index: i + 1,
    state: 'empty' as const,
    teamId: null,
    questionId: null,
    connectionId: null,
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Grid],
    }).compileComponents();

    fixture = TestBed.createComponent(Grid);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cells', mockCells);
    fixture.componentRef.setInput('teams', mockTeams);
    fixture.componentRef.setInput('connections', []);
  });

  it('should render SVG overlay for connections', () => {
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('.connection-overlay');
    expect(svg).toBeTruthy();
  });

  it('should calculate correct cell center positions for connection lines', () => {
    const now = new Date().toISOString();
    const connections: Connection[] = [
      {
        id: 'conn-1',
        cellIndices: [1, 2, 3],
        teamId: 'team-1',
        direction: 'horizontal',
        createdAt: now,
      },
    ];

    fixture.componentRef.setInput('connections', connections);
    fixture.detectChanges();

    // Cell 1 is at index 0: row 0, col 0 -> center (6.25, 6.25)
    // Cell 2 is at index 1: row 0, col 1 -> center (18.75, 6.25)
    // Cell 3 is at index 2: row 0, col 2 -> center (31.25, 6.25)
    const lines = fixture.nativeElement.querySelectorAll('.connection-line');
    expect(lines.length).toBe(2); // Two lines for three cells
  });

  it('should mark connection lines as new within 2 seconds', () => {
    const now = new Date().toISOString();
    const connections: Connection[] = [
      {
        id: 'conn-1',
        cellIndices: [10, 18, 26],
        teamId: 'team-1',
        direction: 'vertical',
        createdAt: now,
      },
    ];

    fixture.componentRef.setInput('connections', connections);
    fixture.detectChanges();

    const lines = fixture.nativeElement.querySelectorAll('.connection-line.is-new');
    expect(lines.length).toBe(2);
  });

  it('should use team color for connection lines', () => {
    const now = new Date().toISOString();
    const connections: Connection[] = [
      {
        id: 'conn-1',
        cellIndices: [1, 2, 3],
        teamId: 'team-1',
        direction: 'horizontal',
        createdAt: now,
      },
    ];

    fixture.componentRef.setInput('connections', connections);
    fixture.detectChanges();

    const lines = fixture.nativeElement.querySelectorAll('.connection-line');
    // Verify stroke attribute contains the team color
    for (const line of lines) {
      expect(line.getAttribute('stroke')).toBe('#FF0000');
    }
  });

  it('should convert cell indices to correct grid positions', () => {
    // Test cells at various grid positions
    // Cell 1 (row 0, col 0): center at (6.25%, 6.25%)
    // Cell 9 (row 1, col 0): center at (6.25%, 18.75%)
    // Cell 64 (row 7, col 7): center at (93.75%, 93.75%)

    const now = new Date().toISOString();
    const connections: Connection[] = [
      {
        id: 'conn-1',
        cellIndices: [1, 9, 64],
        teamId: 'team-1',
        direction: 'vertical',
        createdAt: now,
      },
    ];

    fixture.componentRef.setInput('connections', connections);
    fixture.detectChanges();

    const lines = fixture.nativeElement.querySelectorAll('.connection-line');
    expect(lines.length).toBe(2);

    // Line 1: from cell 1 to cell 9
    expect(parseFloat(lines[0].getAttribute('x1'))).toBeCloseTo(6.25);
    expect(parseFloat(lines[0].getAttribute('y1'))).toBeCloseTo(6.25);
    expect(parseFloat(lines[0].getAttribute('x2'))).toBeCloseTo(6.25);
    expect(parseFloat(lines[0].getAttribute('y2'))).toBeCloseTo(18.75);
  });
});
