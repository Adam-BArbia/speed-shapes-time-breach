import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Cell, Connection, Team } from '../../state/game-state.models';

interface LineSpec {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  teamColor: string;
  isNew: boolean;
}

@Component({
  selector: 'app-grid',
  imports: [],
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Grid {
  readonly cells = input.required<Cell[]>();
  readonly teams = input.required<Team[]>();
  readonly connections = input<Connection[]>([]);
  readonly selectedCellIndex = input<number | null>(null);
  readonly interactive = input(false);
  readonly compact = input(false);

  readonly cellClicked = output<number>();

  readonly teamColors = computed(() => {
    const map = new Map<string, string>();
    for (const team of this.teams()) {
      map.set(team.id, team.color);
    }
    return map;
  });

  readonly connectionLines = computed(() => {
    const lines: LineSpec[] = [];
    const now = new Date();
    const twoSecondsMs = 2000;

    for (const conn of this.connections()) {
      const teamColor = this.teamColors().get(conn.teamId || '') || '#7f8aa3';
      const createdAtMs = new Date(conn.createdAt).getTime();
      const ageMs = now.getTime() - createdAtMs;
      const isNew = ageMs < twoSecondsMs;

      const [idx1, idx2, idx3] = conn.cellIndices;
      const pos1 = this.indexToXY(idx1);
      const pos2 = this.indexToXY(idx2);
      const pos3 = this.indexToXY(idx3);

      // Draw line from cell 1 to 2
      lines.push({
        x1: pos1.x,
        y1: pos1.y,
        x2: pos2.x,
        y2: pos2.y,
        teamColor,
        isNew,
      });

      // Draw line from cell 2 to 3
      lines.push({
        x1: pos2.x,
        y1: pos2.y,
        x2: pos3.x,
        y2: pos3.y,
        teamColor,
        isNew,
      });
    }

    return lines;
  });

  private indexToXY(index: number): { x: number; y: number } {
    const row = Math.floor((index - 1) / 8);
    const col = (index - 1) % 8;
    // Cell size is 12.5% (100/8) of the grid width
    // Position is center of cell: col * 12.5% + 6.25% = (col + 0.5) * 12.5%
    const x = (col + 0.5) * 12.5;
    const y = (row + 0.5) * 12.5;
    return { x, y };
  }

  trackCell(_index: number, cell: Cell): number {
    return cell.index;
  }

  onCellClick(cell: Cell): void {
    if (!this.interactive()) {
      return;
    }
    this.cellClicked.emit(cell.index);
  }

  cellColor(cell: Cell): string {
    if (!cell.teamId) {
      return '#7f8aa3';
    }
    return this.teamColors().get(cell.teamId) ?? '#7f8aa3';
  }

  isSelected(cell: Cell): boolean {
    return this.selectedCellIndex() === cell.index;
  }
}
